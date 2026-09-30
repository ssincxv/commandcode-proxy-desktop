; Keep elevated installers from launching the application as administrator.
!macro commandcodeLaunch
  ${If} ${UAC_IsAdmin}
    ${StdUtils.ExecShellAsUser} $0 "$appExe" "open" "$1"
  ${Else}
    ClearErrors
    Exec '"$appExe" $1'
    IfErrors 0 +2
      MessageBox MB_OK|MB_ICONEXCLAMATION "无法启动 CommandCode Proxy，请从开始菜单打开程序。"
  ${EndIf}
!macroend

!macro customFinishPage
  Function StartCommandCode
    ${If} ${isUpdated}
      StrCpy $1 "--updated"
    ${Else}
      StrCpy $1 ""
    ${EndIf}
    !insertmacro commandcodeLaunch
  FunctionEnd
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartCommandCode"
  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customUnInstall
  ; Electron's openAtLogin uses this per-user Run value.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "CommandCode Proxy"
!macroend
