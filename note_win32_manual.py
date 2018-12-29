import sys
import tkinter
import threading
import time
from tkinter import *

from win32gui import *
from win32con import *
from win32api import *
from win32gui_struct import *
from win32ui import *

from note_base import NoteBase

#InitCommonControlsEx(param)
InitRichEdit()

width = 200
height = 150

cls_idgen = 0

class SimpleNotifier (NoteBase):
    def __init__(self, totlines=3):
        self.hwnd = None
        self.twnd = None
        self.lines = []
        self.totlines = totlines
    
    def push_line(self, s):
        self.lines.append(s)
        
        if len(self.lines) > self.totlines:
            self.lines.pop(0)
            
        self.set_lines()
        
    def startNote(self, title, msg):
        self.title = title
        
        self.lines = [];
        
        if self.hwnd is None:
            self.spawnWindow(title, msg)
            
        ShowWindow(self.hwnd, SW_SHOW)

        self.push_line(msg)
        
        UpdateWindow(self.hwnd)
        
    def makeTextbox(self):
        #self.tbox = CreateRichEditCtrl()
        #rect = (10, 10, 380, 180)
        #self.tbox.CreateWindow(ES_MULTILINE | WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP, rect, self.hwnd, 0)
        
        self.twnd = CreateWindowEx(0, "Edit", "", ES_MULTILINE | WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP,
                                 10, 10, width-30, height-60, self.hwnd, None, self.hinst, None)
    
    def spawnWindow(self, title, msg):
        message_map = {WM_DESTROY: self.on_destroy}
        
        map = {}
        import win32con
        for k in dir(win32con):
            if k.startswith("WM_"):
                map[getattr(win32con, k)] = k
        
        def wndproc(hwnd, msg, wparam, lparam):
            #print("message", imsg);
            if msg in map:
                smsg = map[msg]
            else:
                smsg = "UNKNOWN"

            if msg == WM_PAINT:
                ps = BeginPaint(hwnd)

                UpdateWindow(self.twnd)
                EndPaint(hwnd, ps[1])
                return 0

            print(hwnd, smsg, wparam, lparam)
            return DefWindowProc(hwnd, msg, wparam, lparam)
            
        # Register the window class.
        self.wc = WNDCLASS()
        
        self.hinst = self.wc.hInstance = GetModuleHandle(None)
        
        global cls_idgen
        
        id = cls_idgen
        cls_idgen += 1
        
        self.wc.style |= CS_GLOBALCLASS;
        self.wc.lpszClassName = str("PythonTaskbar" + str(id))  # must be a string
        self.className = self.wc.lpszClassName

        self.wc.lpfnWndProc = wndproc  # could also specify a wndproc.
        
        self.classAtom = RegisterClass(self.wc)
        #print(self.classAtom)
        
        style = WS_OVERLAPPED | WS_POPUP | WS_VISIBLE | WS_CAPTION
        self.hwnd = CreateWindow(self.classAtom, self.title, style,
                                 1335, 0, width, height, None, None, self.hinst, None)
                                 
        SetWindowPos(self.hwnd, HWND_TOPMOST, 0,0,0,0,
                              SWP_NOMOVE | SWP_NOSIZE)
            
        self.makeTextbox()
        
        ShowWindow(self.hwnd, SW_SHOW)
        
        self.set_lines()

    def set_lines(self):
        txt = ""
        #print(self.lines)
        for l in self.lines:
            txt += l + "\n"
        
        txt = txt.replace("\n", "\r\n")
         
        if txt.strip() == "":
            return
            
        print("TEXT", repr(txt), txt == "Test")

        SetWindowText(self.twnd, txt);
        UpdateWindow(self.twnd)
        UpdateWindow(self.hwnd)

    def handleMessages(self):
        PumpWaitingMessages(self.hwnd);
        #PumpWaitingMessages(self.twnd);

    def appendNote(self, msg):
        self.push_line(msg)

    def clearNote(self):
        self.lines = [];

    def hideNote(self):
        ShowWindow(self.hwnd, SW_HIDE)
        #print("CLOSING", CloseWindow(self.hwnd))

    def killNote(self):
        DestroyWindow (self.hwnd)

        UnregisterClass(self.className, self.hinst)
    
    def on_destroy(self):
        PostQuitMessage(0)
        
if __name__ == "__main__":
    print("Start");
    
    for si in range(1):
        n = SimpleNotifier();
        n.startNote("Build System", "Test")
        
        time.sleep(1)

        for i in range(3):
            n.appendNote("Bleh!" + str(i))
            time.sleep(0.5)
        
        time.sleep(0.5)
        n.hideNote()
        
        time.sleep(0.5)
        print("yay");
    
    
    