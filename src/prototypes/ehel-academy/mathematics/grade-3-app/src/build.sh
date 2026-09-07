#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# $1 = slug, $2 = title
sed "s|<title>What Comes Next</title>|<title>$2</title>|" _head.html > .h1
awk '/^<\/style>$/{while((getline line < "g3-css.css")>0) print line; close("g3-css.css")} {print}' .h1 > .h2
sed 's/!== "g1"/!== "g3"/; s/Grade 1 Maths/Grade 3 Maths/' _shell.js > .s1
cat .h2 "$1-slides.html" _foot.html .s1 "$1-content.js" > "$3"
rm -f .h1 .h2 .s1
node -e "
const fs=require('fs');const s=fs.readFileSync('$3','utf8');
const i=s.indexOf('<script>');fs.writeFileSync('.chk.js', s.slice(i+8, s.lastIndexOf('</script>')));
"
node --check .chk.js && rm -f .chk.js
echo "$3: $(wc -c < "$3") bytes, $(grep -c 'class="slide"' "$3") slides"
