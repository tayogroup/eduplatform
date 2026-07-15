-- Random 5-digit Moodle user ID number verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Recent active users and ID number format.
SELECT u.id AS userid,
       CONCAT(u.firstname, ' ', u.lastname) AS user_name,
       u.username,
       u.email,
       u.idnumber,
       CASE
           WHEN u.idnumber REGEXP '^[0-9]{5}$' THEN 'VALID_5_DIGIT'
           WHEN u.idnumber = '' THEN 'BLANK'
           ELSE 'NON_5_DIGIT'
       END AS idnumber_status,
       FROM_UNIXTIME(u.timecreated) AS created_at
FROM mdlgx_user u
WHERE u.deleted = 0
  AND u.id > 1
ORDER BY u.timecreated DESC, u.id DESC
LIMIT 100;

-- 2) Duplicate 5-digit ID numbers. This should return zero rows.
SELECT idnumber,
       COUNT(*) AS duplicate_count,
       GROUP_CONCAT(id ORDER BY id ASC) AS userids
FROM mdlgx_user
WHERE deleted = 0
  AND idnumber REGEXP '^[0-9]{5}$'
GROUP BY idnumber
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, idnumber ASC;

-- 3) Active users missing the new 5-digit format.
SELECT COUNT(*) AS users_without_5_digit_idnumber
FROM mdlgx_user
WHERE deleted = 0
  AND id > 1
  AND (idnumber IS NULL OR idnumber NOT REGEXP '^[0-9]{5}$');
