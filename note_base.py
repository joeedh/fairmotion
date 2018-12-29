class NoteBase:
    def __init__(self):
        self.notes = {}

    def startNote(self, id, title, msg):
        print("Unimplemented notification!")
        print("    Notification was " + msg)

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

    def sleep(self, s):
        time.sleep(s)

    def showNote(self, id, title, msg):
        if self.hasNote(id):
            self.clearNote(id)
            self.appendNote(id, msg)
        else:
            self.startNote(id, title, msg)

    def sleep(s):
        time.sleep(s);
