import sys, time
from note_base import NoteBase

_driver = None

class NoteManager:
    def __init__(self):
        self.notes = {}
    
    def __del__(self):
        notes = self.notes
        self.notes = {}
        
        for id in notes:
            notes[id].killNote()
        
    def startNote(self, id, title, msg):
        if id not in self.notes:
            self.notes[id] = _driver(id)

        self.notes[id].showNote(title, msg)

    def hideNote(self, id):
        if id not in self.notes:
            print("Warning: unknown note", id);
            return

        self.notes[id].hideNote()

    def killNote(self, id):
        if id not in self.notes:
            print("Warning: unknown note", id);
            return

        #remove note from list first to avoid data corruption
        #if an error happens
        n = self.notes[id]
        del self.notes[id]

        n.killNote();

    def appendNote(self, id, msg):
        self.notes[id].appendNote(msg)

    def hasNote(self, id):
        return id in self.notes

    def clearNote(self, id):
        return self.notes[id].clearNote();

    def showNote(self, id, title, msg):
        if self.hasNote(id):
            self.notes[id].showNote(title, msg);
        else:
            self.startNote(id, title, msg)

    def handleUpdates(self):
        for id in self.notes:
            self.notes[id].handleUpdates()

    def destroy(self):
        for id in self.notes:
            self.notes[id].killNote()
        self.notes = {}

    def sleep(self, s):
        #t = time.time()
        #while time.time() - t < s:
        #    continue
        return time.sleep(s)
        
        t = time.time()
        first = True
        
        #ds = min(s, 0.05)
        ds = 0.005
        
        while first or time.time() - t < s:
            first = False

            self.handleUpdates()
            time.sleep(ds);
            #import win32api
            #win32api.SleepEx(1, 1) #, False)

if sys.platform == "win32":
    import note_win32_manual

    _driver = note_win32_manual.SimpleNotifier
else:
    _driver = NoteBase #stub implementation

manager = NoteManager()

#add manager's methods to module exports
for key in dir(manager):
    if key.startswith("_"): continue
    v = getattr(manager, key)

    if not hasattr(v, "__call__"): #we only want methods
        continue;
    globals()[key] = v

if __name__ == "__main__" and 0:
    showNote("1", "Build System", "Test");
    time.sleep(1)
    appendNote("1", "Change");
    time.sleep(1);
    hideNote("1");


