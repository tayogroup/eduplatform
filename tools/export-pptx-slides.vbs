Option Explicit

Dim sourcePath, outputPath, fso, ppt, deck

If WScript.Arguments.Count < 2 Then
  WScript.Echo "Usage: cscript //Nologo export-pptx-slides.vbs <source.pptx> <output-folder>"
  WScript.Quit 2
End If

sourcePath = WScript.Arguments.Item(0)
outputPath = WScript.Arguments.Item(1)

Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(sourcePath) Then
  WScript.Echo "Missing PPTX: " & sourcePath
  WScript.Quit 3
End If
If Not fso.FolderExists(outputPath) Then
  fso.CreateFolder outputPath
End If

On Error Resume Next
Set ppt = CreateObject("PowerPoint.Application")
If Err.Number <> 0 Then
  WScript.Echo "Could not start PowerPoint: " & Err.Description
  WScript.Quit 4
End If
On Error GoTo 0

ppt.Visible = True
Set deck = ppt.Presentations.Open(sourcePath, False, False, False)
deck.Export outputPath, "PNG", 1600, 900
deck.Close
ppt.Quit

Set deck = Nothing
Set ppt = Nothing
WScript.Quit 0
