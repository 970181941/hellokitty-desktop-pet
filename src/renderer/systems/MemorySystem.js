const { getTodayStr, getTodayMMDD, daysBetween } = require('../utils/helpers');

class MemorySystem {
  constructor() {
    this.ownerName = '';
    this.ownerBirthday = ''; // MM-DD
    this.firstMeetingDate = ''; // YYYY-MM-DD
    this.reminders = []; // [{ id, date, text, completed }]
  }

  init(savedState) {
    if (savedState) {
      this.ownerName = savedState.ownerName || '';
      this.ownerBirthday = savedState.ownerBirthday || '';
      this.firstMeetingDate = savedState.firstMeetingDate || '';
      this.reminders = savedState.reminders || [];
    }
    // 首次运行记录相识日期
    if (!this.firstMeetingDate && this.ownerName) {
      this.firstMeetingDate = getTodayStr();
    }
  }

  isFirstRun() {
    return !this.ownerName;
  }

  getOwnerName() {
    return this.ownerName;
  }

  getOwnerBirthday() {
    return this.ownerBirthday;
  }

  setOwnerName(name) {
    this.ownerName = name;
    if (!this.firstMeetingDate) {
      this.firstMeetingDate = getTodayStr();
    }
  }

  setOwnerBirthday(date) {
    this.ownerBirthday = date; // MM-DD
  }

  getDaysSinceFirstMeeting() {
    if (!this.firstMeetingDate) return 0;
    return daysBetween(this.firstMeetingDate, getTodayStr());
  }

  isTodayBirthday() {
    if (!this.ownerBirthday) return false;
    return getTodayMMDD() === this.ownerBirthday;
  }

  getReminders() {
    return this.reminders;
  }

  addReminder(reminder) {
    this.reminders.push({
      id: Date.now().toString(),
      date: reminder.date,
      text: reminder.text,
      completed: false,
    });
  }

  removeReminder(id) {
    this.reminders = this.reminders.filter(r => r.id !== id);
  }

  markReminderCompleted(id) {
    const r = this.reminders.find(r => r.id === id);
    if (r) r.completed = true;
  }

  getTodayReminders() {
    const today = getTodayMMDD();
    const todayFull = getTodayStr();
    return this.reminders.filter(r => {
      if (r.completed) return false;
      return r.date === today || r.date === todayFull;
    });
  }

  getUpcomingReminders(withinDays = 7) {
    // 简单实现：返回所有未完成的提醒
    return this.reminders.filter(r => !r.completed);
  }

  getState() {
    return {
      ownerName: this.ownerName,
      ownerBirthday: this.ownerBirthday,
      firstMeetingDate: this.firstMeetingDate,
      reminders: this.reminders,
    };
  }
}

module.exports = MemorySystem;
