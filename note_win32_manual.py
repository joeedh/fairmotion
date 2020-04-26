import ctypes
import ctypes.wintypes
import sys
if sys.version[0] != '2':
  import queue #for thread-safe queue
  import tkinter
else:
  import Queue as queue
  import Tkinter as tkinter
  
import threading
import time
from tkinter import *

from win32gui import *
from win32con import *
from win32api import *
from win32gui_struct import *
from win32ui import *

from note_base import NoteBase

import threading

def tst(a, b, c, d):
    return 0;

DEBUG = 0
    
UPDATE_TEXT = 0
SETHIDE = 1
KILLNOTE = 2
_BREAK_THREAD = 3

#InitCommonControlsEx(param)
InitRichEdit()

width = 200
height = 150

cls_idgen = 0

class SimpleNotifier (NoteBase):
    def __init__(self, note_id, totlines=3):
        super().__init__(note_id)
        
        self._block_commands = False
        self._has_spawned = False
        
        self.hwnd = None
        self.twnd = None
        self.lines = []
        self.totlines = totlines
        self.hidden = False
        self.buf = ""
        self._threadref = None
        
        self.queue = queue.Queue()
        
    def push_line(self, s):
        self.lines.append(s)
        
        if len(self.lines) > self.totlines:
            self.lines.pop(0)
        
        self.buf = "\n".join(self.lines)
        self._pushcmd(UPDATE_TEXT, self.buf[:])
        
    def showNote(self, title, msg):
        self.title = title

        if self.hwnd is None and not self._has_spawned:
            self._has_spawned = True
            self.spawnWindow(title, msg)
            
            self._pushcmd(SETHIDE, 0)
            self.push_line(msg)
            return
            
        self._pushcmd(SETHIDE, 0)
        self.push_line(msg)
        
    def makeTextbox(self):
        #self.tbox = CreateRichEditCtrl()
        #rect = (10, 10, 380, 180)
        #self.tbox.CreateWindow(ES_MULTILINE | WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP, rect, self.hwnd, 0)
        
        self.twnd = CreateWindowEx(0, "Edit", "", ES_MULTILINE | WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP,
                                 10, 10, width-30, height-60, self.hwnd, None, self.hinst, None)
    
    def RegisterClassCtypes(self, cls):
        c_uint = ctypes.c_uint;
        c_int = ctypes.c_int
        c_char_p = ctypes.c_char_p;
        c_void_p = ctypes.c_void_p
        POINTER = ctypes.POINTER;
        pointer = ctypes.pointer
        byref = ctypes.byref
        c_int_p = POINTER(c_int)
        c_wchar_p = ctypes.c_wchar_p
        
        wnd = cls.lpfnWndProc
        
        LRESULT = c_void_p #ctypes.wintypes.LPHANDLE
        LPARAM = c_void_p
        HANDLE = ctypes.wintypes.HANDLE
        
        DefWindowProcW = ctypes.windll.user32.DefWindowProcW
        DefWindowProcW.restype = LRESULT
                
        def DefWindowProc(hwnd, msg, wparam, lparam):
            return DefWindowProcW(hwnd, c_uint(msg), LPARAM(wparam), LPARAM(lparam))
        
        self.DefWindowProc = DefWindowProc
        
        self._wndproc = wndproc = cls.lpfnWndProc
        
        def callback(hwnd, msg, wparam, lparam):
            ret = wndproc(hwnd, msg, wparam, lparam)
            return 0 if ret is None else ret
         
        self._callback_ref = callback
        
        MYFUNCTYPE = ctypes.WINFUNCTYPE(LRESULT, HANDLE, c_uint, LPARAM, LPARAM)
        
        class WNDCLASS (ctypes.Structure):
            _fields_ = [
              ("style", c_uint),
              ("lpfnWndProc", MYFUNCTYPE),
              ("cbClsExtra", c_int),
              ("cbWndExtra", c_int),
              ("hInstance", HANDLE),
              ("hIcon", HANDLE),
              ("hCursor", HANDLE),
              ("hbrBackground", HANDLE),
              ("lpszMenuName", c_wchar_p),
              ("lpszClassName", c_wchar_p)
            ]
        
        wnd = WNDCLASS()
        
        self.wnd = wnd
        
        wnd.style = cls.style;
        wnd.lpfnWndProc = MYFUNCTYPE(callback)
        wnd.hInstance = cls.hInstance;
        
        #wnd.lpszMenuName = ctypes.create_unicode_buffer("") 
        wnd.lpszClassName = cls.lpszClassName#ctypes.create_unicode_buffer(cls.lpszClassName) 
        
        #str(cls.lpszClassName, "latin-1"))
        
        #wnd.hIcon = cls.hIcon
        
        #print(cls.cbWndExtra)
        
        wnd.hbrBackground = 7 #COLOR_WINDOW+1
        #wnd.hbrBackground = cls.hbrBackground; #COLOR_BACKGROUND+1
        
        ret = ctypes.windll.user32.RegisterClassW(pointer(wnd))
        
        if not ret:
            raise RuntimeError("failed to create window: " + str(GetLastError()))
            pass
        
        return ret        
        
        #self.wc.style |= CS_GLOBALCLASS;
        #self.wc.lpszClassName = str("PythonTaskbar" + str(id))  # must be a string
        #self.wc.lpfnWndProc = wndproc  # could also specify a wndproc.

        
    def _pushcmd(self, cmd, args):
        self.queue.put([cmd, args])
        
    def spawnWindow_intern(self, title, msg):
        message_map = {WM_DESTROY: self.on_destroy}
        
        map = {}
        import win32con
        for k in dir(win32con):
            if k.startswith("WM_"):
                map[getattr(win32con, k)] = k

        def wndproc(hwnd, msg, wparam, lparam):
            DefWindowProc = self.DefWindowProc

            if msg == WM_PAINT:
                ps = BeginPaint(hwnd)

                #UpdateWindow(self.twnd)
                EndPaint(hwnd, ps[1])
                return 0
            elif msg == WM_DESTROY:
                print("                                       Got WM_DESTROY!")
                PostQuitMessage(0)
                
                return 0
            elif msg == WM_QUIT:
                self._pushcmd(_BREAK_THREAD, 0)
                return 0
                
            #    PostQuitMessage(0)
            #    self.hwnd = None
            #    return 0
            #if msg == WM_QUIT:
            #    print("got quit message")
            #    self.hwnd = None
            #elif msg == WM_GETICON:
            #    return self.icon

            ret = DefWindowProc(hwnd, msg, wparam, lparam)

            if msg in map:
                smsg = map[msg]
            else:
                smsg = "UNKNOWN" + ":" + str(msg)

            if DEBUG: print(ret, smsg, wparam, lparam, GetLastError())
            return ret
        
        
        ctypes.windll.user32.DisableProcessWindowsGhosting()
        
        # Register the window class.
        self.wc = WNDCLASS()

        global cls_idgen
        
        id = cls_idgen
        cls_idgen += 1

        self.icon = self.wc.hIcon = LoadIcon(None, IDI_QUESTION);
        
        self.hinst = self.wc.hInstance = GetModuleHandle(None)
        self.wc.style |= CS_GLOBALCLASS;
        self.wc.lpszClassName = str("PythonTaskbar" + str(id))  # must be a string
        self.wc.lpfnWndProc = wndproc  # could also specify a wndproc.

        self.className = self.wc.lpszClassName
        self.classAtom = self.RegisterClassCtypes(self.wc)
        
        if DEBUG: print("Error:", GetLastError())

        #print(self.classAtom)
        
        style = WS_VISIBLE | WS_OVERLAPPED | WS_POPUP | WS_VISIBLE | WS_CAPTION
        #exstyle = WS_EX_NOACTIVATE #move to CreateWindowEx and put this in extended  style
                                 
        self.hwnd = CreateWindow(self.classAtom, self.title, style,
                                 1335, 0, width, height, None, None, self.hinst, None)

        SetWindowPos(self.hwnd, HWND_TOPMOST, 0,0,0,0,
                              SWP_NOMOVE | SWP_NOSIZE)
            
        self.makeTextbox()
        
        
        ShowWindow(self.hwnd, SW_SHOW)
        UpdateWindow(self.hwnd);
        
        #add timer to nudge message queue every once in a while
        ctypes.windll.user32.SetTimer(self.hwnd, 1, 250, None)
        
        #buf = "\n".join(self.lines)
        #self.set_lines(buf)
    
    def spawnWindow(self, title, msg):
        if self.hwnd is not None:
            sys.stderror.write("ERROR ERROR! spawnWindow  called twice!!\n");
            
        self.title = title
        self.msg = msg
        
        def threadloop():
            print("Starting notification thread")
            
            self.spawnWindow_intern(self.title, self.msg)
            
            t = time.time()
            while 1:
                #if time.time() - t > 3: break #XXX
                
                try:
                    cmd = self.queue.get(0) #don't wait
                except queue.Empty:
                    cmd = None
                    
                if cmd is not None and cmd[0] == _BREAK_THREAD:
                    print("Got break signal in thread")
                    break
                elif cmd is not None:
                    self._docommand(cmd)
                    
                if self.hwnd is None:
                    break;
                
                msg = ctypes.wintypes.MSG()
                byref = ctypes.byref
                POINTER = ctypes.POINTER
                
                #QS_ALLPOSTMESSAGE
                #ctypes.windll.user32.MsgWaitForMultipleObjects();
                handles = ctypes.wintypes.HANDLE
                #retw = ctypes.windll.user32.MsgWaitForMultipleObjectsEx(
                #                                     0, #// no handles
                #                                     0, #// no handles
                #                                     5, # 55,
                #                                     QS_ALLINPUT,
                #                                     MWMO_ALERTABLE)
                #SleepEx(1, 1);
                
                #if (self.hidden):
                #    continue;
                    
                #retw = ctypes.windll.user32.WaitMessage()
                #SleepEx(1, True)
                Sleep(1);
                
                ret = ctypes.windll.user32.PeekMessageW(byref(msg), 0, 0);
                
                if ret == 0: #no messages available
                    continue
                
                retm = ctypes.windll.user32.GetMessageW(byref(msg), None, 0, 0);

                if retm:
                    if DEBUG: print("got message!!!! -----------------------------");
                    retd = ctypes.windll.user32.DispatchMessageW(byref(msg));
                    if DEBUG: print(retd)
                else: #if GetLastError() == 0:
                    if DEBUG: print("quit time", GetLastError())
                    #PostQuitMessage(0)
                    break
                
                
                #TranslateMessage(ret);

                #print("RET", ret)
                #PumpWaitingMessages(self.hwnd);
                
            if DEBUG: print("Exit notification thread")
            self._threadref = None
        
        thread = threading.Thread(target=threadloop)
        thread.start()
        
        self._threadref = thread
        
    def set_lines(self, txt):
        if not "\r" in txt:
            txt = txt.replace("\n", "\r\n")
         
        #if txt.strip() == "":
        #    return
            
        #print("TEXT", repr(txt), txt == "Test")
        
        if self.hwnd is None:
            print("hwnd was none in set_lines")
            return
        
        if DEBUG: print(self.twnd)
        SetWindowText(self.twnd, txt);

        #UpdateWindow(self.twnd)
        UpdateWindow(self.hwnd)

    def handleUpdates(self):
        pass #using threads now

    def appendNote(self, msg):
        self.push_line(msg)

    def clearNote(self):
        self.lines = [];

    def hideNote(self):
        self._pushcmd(SETHIDE, 1)
    
    def _docommand(self, cmd):
        if DEBUG: print("  Got command!")
        
        if self.hwnd is None:
            print("got command after hwnd died")
            return
            
        cmd, args = cmd
        if  cmd == SETHIDE:
            self.hidden = args
            ShowWindow(self.hwnd, SW_HIDE if args else SW_SHOW);
            UpdateWindow(self.hwnd)
        elif cmd == UPDATE_TEXT:
            self.buf = args
            self.set_lines(self.buf)
        elif cmd == KILLNOTE and self.hwnd is not None and self._threadref is not None:
            hwnd = self.hwnd
            
            self.hwnd = None
            if DEBUG: print("DESTROYING WINDOW================", hwnd)
            
            if not DestroyWindow(hwnd):
                sys.stderr.write("Error closing window " + str(hwnd) + "\n");
                sys.stderr.write("  lasterrer: " + str(GetLastError()) + "\n");
                self.hwnd = None
            else:
                self.hwnd = None
                if DEBUG: print("Closing window class")
                
                UnregisterClass(self.className, self.hinst)
            

    def killNote(self):
        
        self._pushcmd(_BREAK_THREAD, 0)
        self._pushcmd(KILLNOTE, 0)
        
        print("waiting for note thread to disappear. . .")
        while self._threadref is not None:
            time.sleep(0.001)
            pass
        print("done waiting")
        
    def on_destroy(self):
        self._pushcmd(KILLNOTE, 0)
        
        
if __name__ == "__main__":
    print("Start");

    n = SimpleNotifier(1)
    print(n.note_id)

    """
    for si in range(1):
        n = SimpleNotifier();
        n.showNote("Build System", "Test")
        
        time.sleep(1)

        for i in range(3):
            n.appendNote("Bleh!" + str(i))
            time.sleep(0.5)
        
        time.sleep(0.5)
        n.hideNote()
        
        time.sleep(0.5)
        print("yay");
    #"""

    
    