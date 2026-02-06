Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batFile = scriptDir & "\start-backend.bat"

' Run the batch file hidden (0 = hidden window, True = wait for it to finish)
WshShell.Run """" & batFile & """", 0, False

' Show a brief notification (optional)
WshShell.Popup "Backend server is starting on port 8080..." & vbCrLf & "It will run in the background.", 3, "TECH-PRO AI Backend", 64
