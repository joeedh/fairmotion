#include "windows.h"

#include <node.h>
#include <v8.h>

LRESULT newProc(HWND hWnd, UINT msg, WPARAM wP, LPARAM hP) {
  printf("messages! %d\n", msg);

  return 0;
}

void setcolor()
{
    void *oldProc = (void*) SetWindowLongPtr(GetTopWindow(NULL), GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(newProc));
    
    return;

    int aElements[2] = {COLOR_WINDOW, COLOR_ACTIVECAPTION};
    DWORD aOldColors[2];
    DWORD aNewColors[2];

    // Get the current color of the window background. 
 
    aOldColors[0] = GetSysColor(aElements[0]); 

    printf("Current window color: {0x%x, 0x%x, 0x%x}\n", 
        GetRValue(aOldColors[0]), 
        GetGValue(aOldColors[0]), 
        GetBValue(aOldColors[0]));

    // Get the current color of the active caption. 
 
    aOldColors[1] = GetSysColor(aElements[1]); 

    printf("Current active caption color: {0x%x, 0x%x, 0x%x}\n", 
        GetRValue(aOldColors[1]), 
        GetGValue(aOldColors[1]), 
        GetBValue(aOldColors[1]));

    // Define new colors for the elements

    aNewColors[0] = RGB(0x20, 0x20, 0x20);  // light gray 
    aNewColors[1] = RGB(0x20, 0x00, 0x20);  // dark purple 

    printf("\nNew window color: {0x%x, 0x%x, 0x%x}\n", 
        GetRValue(aNewColors[0]), 
        GetGValue(aNewColors[0]), 
        GetBValue(aNewColors[0]));

    printf("New active caption color: {0x%x, 0x%x, 0x%x}\n", 
        GetRValue(aNewColors[1]), 
        GetGValue(aNewColors[1]), 
        GetBValue(aNewColors[1]));

    // Set the elements defined in aElements to the colors defined
    // in aNewColors

    SetSysColors(2, aElements, aNewColors); 

    for (int i=0; i<55; i += 2) {
      aElements[0] = i;
      aElements[1] = i+1;
      SetSysColors(2, aElements, aNewColors);
    }

    printf("lasterror: %d\n", GetLastError());

    //Sleep(4000);    

    // Restore the elements to their original colors

    //SetSysColors(2, aElements, aOldColors); 
}

static void Method(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  setcolor();

  args.GetReturnValue().Set(v8::String::NewFromUtf8(
        isolate, "world", v8::NewStringType::kNormal).ToLocalChecked());
}

// Not using the full NODE_MODULE_INIT() macro here because we want to test the
// addon loader's reaction to the FakeInit() entry point below.
extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports,
                        v8::Local<v8::Value> module,
                        v8::Local<v8::Context> context) {
  NODE_SET_METHOD(exports, "hello", Method);
}


NODE_MODULE(NODE_GYP_MODULE_NAME, NODE_MODULE_INITIALIZER)
