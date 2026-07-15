Option Explicit

Dim fso, shell, root, maicZip, assetsZip, slug
Dim workDir, maicDir, assetsDir, combinedDir, slideDir, outFile, saveFile
Dim manifestPath, audioDir, mediaDir, pptxPath

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

If WScript.Arguments.Count >= 1 Then
  maicZip = WScript.Arguments.Item(0)
Else
  maicZip = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\Downloads\Fractions with Pizza.maic.zip"
End If

If WScript.Arguments.Count >= 2 Then
  assetsZip = WScript.Arguments.Item(1)
Else
  assetsZip = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\Downloads\Fractions with Pizza.zip"
End If

If WScript.Arguments.Count >= 3 Then
  slug = WScript.Arguments.Item(2)
Else
  slug = "openmaic-lesson"
End If

workDir = root & "\outputs\openmaic\work\" & slug
maicDir = workDir & "\maic"
assetsDir = workDir & "\assets"
combinedDir = workDir & "\combined"
slideDir = workDir & "\slides"
outFile = root & "\dist\pre_quraan\units\openmaic-classroom\" & slug & "-standalone.html"
saveFile = root & "\outputs\openmaic\" & slug & "-standalone.html"

If Not fso.FileExists(maicZip) Then Die "Missing OpenMAIC classroom ZIP: " & maicZip
If Not fso.FileExists(assetsZip) Then Die "Missing OpenMAIC companion ZIP: " & assetsZip

If fso.FolderExists(workDir) Then fso.DeleteFolder workDir, True
EnsureDir maicDir
EnsureDir assetsDir
EnsureDir combinedDir
EnsureDir slideDir

WScript.Echo "Extracting OpenMAIC ZIPs..."
Run "tar.exe -xf " & Q(maicZip) & " -C " & Q(maicDir)
Run "tar.exe -xf " & Q(assetsZip) & " -C " & Q(assetsDir)

manifestPath = FindFirstFile(maicDir, "manifest.json")
If manifestPath = "" Then Die "No manifest.json found in " & maicZip
fso.CopyFile manifestPath, combinedDir & "\manifest.json", True

audioDir = FindFirstDir(maicDir, "audio")
If audioDir = "" Then Die "No audio folder found in " & maicZip
CopyFolderContents audioDir, combinedDir & "\audio"

mediaDir = FindFirstDir(maicDir, "media")
If mediaDir <> "" Then CopyFolderContents mediaDir, combinedDir & "\media"

pptxPath = FindFirstExtension(assetsDir, "pptx")
If pptxPath <> "" Then
  fso.CopyFile pptxPath, combinedDir & "\" & fso.GetFileName(pptxPath), True
  WScript.Echo "Exporting PowerPoint slides..."
  RunVisible "cscript.exe //Nologo " & Q(root & "\tools\export-pptx-slides.vbs") & " " & Q(pptxPath) & " " & Q(slideDir), True
Else
  WScript.Echo "No PPTX found. The lesson will use JSON-rendered slides."
End If

CopyFilesWithExtension assetsDir, "html", combinedDir

WScript.Echo "Creating polished standalone HTML..."
EnsureDir fso.GetParentFolderName(outFile)
Run "node " & Q(root & "\tools\create-openmaic-standalone-html.js") & " " & Q(combinedDir) & " " & Q(outFile) & " " & Q(slideDir)

EnsureDir fso.GetParentFolderName(saveFile)
fso.CopyFile outFile, saveFile, True

WScript.Echo ""
WScript.Echo "Polished OpenMAIC lesson generated."
WScript.Echo "Served file: " & outFile
WScript.Echo "Saved copy:  " & saveFile
WScript.Echo "Work dir:    " & workDir

Sub CopyFilesWithExtension(sourceDir, extension, targetDir)
  Dim folder, file, subfolder
  Set folder = fso.GetFolder(sourceDir)
  For Each file In folder.Files
    If LCase(fso.GetExtensionName(file.Name)) = LCase(extension) Then
      fso.CopyFile file.Path, targetDir & "\" & file.Name, True
    End If
  Next
  For Each subfolder In folder.SubFolders
    CopyFilesWithExtension subfolder.Path, extension, targetDir
  Next
End Sub

Sub CopyFolderContents(sourceDir, targetDir)
  EnsureDir targetDir
  Run "xcopy " & Q(sourceDir & "\*") & " " & Q(targetDir & "\") & " /e /i /y >nul"
End Sub

Function FindFirstExtension(startDir, extension)
  Dim folder, file, subfolder, found
  Set folder = fso.GetFolder(startDir)
  For Each file In folder.Files
    If LCase(fso.GetExtensionName(file.Name)) = LCase(extension) Then
      FindFirstExtension = file.Path
      Exit Function
    End If
  Next
  For Each subfolder In folder.SubFolders
    found = FindFirstExtension(subfolder.Path, extension)
    If found <> "" Then
      FindFirstExtension = found
      Exit Function
    End If
  Next
  FindFirstExtension = ""
End Function

Function FindFirstFile(startDir, fileName)
  Dim folder, file, subfolder, found
  Set folder = fso.GetFolder(startDir)
  For Each file In folder.Files
    If LCase(file.Name) = LCase(fileName) Then
      FindFirstFile = file.Path
      Exit Function
    End If
  Next
  For Each subfolder In folder.SubFolders
    found = FindFirstFile(subfolder.Path, fileName)
    If found <> "" Then
      FindFirstFile = found
      Exit Function
    End If
  Next
  FindFirstFile = ""
End Function

Function FindFirstDir(startDir, dirName)
  Dim folder, subfolder, found
  Set folder = fso.GetFolder(startDir)
  For Each subfolder In folder.SubFolders
    If LCase(subfolder.Name) = LCase(dirName) Then
      FindFirstDir = subfolder.Path
      Exit Function
    End If
  Next
  For Each subfolder In folder.SubFolders
    found = FindFirstDir(subfolder.Path, dirName)
    If found <> "" Then
      FindFirstDir = found
      Exit Function
    End If
  Next
  FindFirstDir = ""
End Function

Sub EnsureDir(dirPath)
  If dirPath = "" Then Exit Sub
  If fso.FolderExists(dirPath) Then Exit Sub
  EnsureDir fso.GetParentFolderName(dirPath)
  fso.CreateFolder dirPath
End Sub

Sub Run(command)
  Dim exitCode
  exitCode = shell.Run("cmd.exe /c " & command, 0, True)
  If exitCode <> 0 Then Die "Command failed (" & exitCode & "): " & command
End Sub

Sub RunVisible(command, allowFailure)
  Dim exitCode
  exitCode = shell.Run("cmd.exe /c " & command, 1, True)
  If exitCode <> 0 Then
    If allowFailure Then
      WScript.Echo "Command failed (" & exitCode & "), continuing with fallback: " & command
    Else
      Die "Command failed (" & exitCode & "): " & command
    End If
  End If
End Sub

Function Q(value)
  Q = """" & Replace(CStr(value), """", "\""") & """"
End Function

Sub Die(message)
  WScript.Echo message
  WScript.Quit 1
End Sub
