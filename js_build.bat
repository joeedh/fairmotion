if exist c:\python313\python.exe (
    echo "Found python"
    set PYTHON=c:\python313
) else (
    if exist c:\python312\python.exe (
         echo "Found python"
         set PYTHON=c:\python312
    ) else (
        if exist c:\python311\python.exe (
            echo "Found python"
            set PYTHON=c:\python311
        ) else (
            if exist c:\python310\python.exe (
                echo "Found python"
                set PYTHON=c:\python310
            ) else (
                if exist c:\python39\python.exe (
                    echo "Found python"
                    set PYTHON=c:\python39
                ) else (
                    echo "Error: could not find python"
                    exit /b -1
                )
            )
        )
    )     
)

set path=%PYTHON%;%path%
set PYTHONHOME=%PYTHON%
set PYTHONLIB=%PYTHON%\Lib;%PYTHON%\libs;%PYTHON%\DLLs;%PYTHON%\Lib\site-packages;%PYTHON%\Scripts
set path=%~dp0;%~dp0..;%path%
@REM try the script named as the .bat file in current dir, then in Scripts subdir
set scriptname=%~dp0%~n0.py

python "%scriptname%" %*
