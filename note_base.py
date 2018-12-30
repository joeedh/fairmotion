class NoteBase:
    def __init__(self, note_id):
        self.notes = {}
        self.note_id = note_id
        self.hidden = False

    def showNote(self, title, msg):
        self.hidden = False

    def hideNote(self):
        self.hidden = True

    def killNote(self):
        pass

    def appendNote(self, msg):
        pass

    def hasNote(self):
        pass

    def clearNote(self):
        pass

    def sleep(self, s):
        time.sleep(s)

    #handle needed updates
    def handleUpdates(self):
        pass
