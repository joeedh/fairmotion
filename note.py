import sys, time
from note_base import NoteBase

_driver = None

if sys.platform == "win32":
    import note_win32_manual

    class Win32Note (NoteBase):
        def __init__(self):
            #super(NoteBase, self).__init__()
            super().__init__()

        def startNote(self, id, title, msg):
            global notes
            self.notes[id] = note_win32_manual.SimpleNotifier()
            self.notes[id].startNote(title, msg)

        def sleep(self, s):
            t = time.time()
            first = True

            while first or time.time() - t < s:
                #print("%.4f %.4f" % (time.time()-t, s))
                first = False
                for id in self.notes:
                    self.notes[id].handleMessages()

                time.sleep(0.02);

    _driver = Win32Note()
else:
    _driver = NodeBase() #stub implementation

#add _driver's methods to module exports
for key in dir(_driver):
    if key.startswith("_"): continue
    v = getattr(_driver, key)

    if not hasattr(v, "__call__"): #we only want methods
        continue;
    globals()[key] = v

def showNote(id, title, msg):
    if hasNote(id):
        clearNote(id)
        appendNote(id, msg)
    else:
        startNote(id, title, msg)

if __name__ == "__main__" and 0:
    showNote("1", "Build System", "Test");
    time.sleep(1)
    appendNote("1", "Change");
    time.sleep(1);
    hideNote("1");


