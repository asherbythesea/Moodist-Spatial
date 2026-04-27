import type { PomodoroConfig } from '@/lib/types';
import { mixer } from './mixer.svelte';
import { audioEngine } from '@/lib/audio/AudioEngine';

class TimerStore {
  // Sleep timer
  sleepRunning = $state(false);
  sleepRemaining = $state(0);
  sleepTotal = $state(0);
  private sleepInterval: ReturnType<typeof setInterval> | null = null;

  // Pomodoro timer
  pomodoroRunning = $state(false);
  pomodoroRemaining = $state(25 * 60);
  pomodoroTotal = $state(25 * 60);
  pomodoroConfig = $state<PomodoroConfig>({
    workMinutes: 25,
    breakMinutes: 5,
    isBreak: false,
  });
  private pomodoroInterval: ReturnType<typeof setInterval> | null = null;

  // --- Sleep Timer ---

  startSleep(minutes: number): void {
    this.clearSleep();
    this.sleepTotal = minutes * 60;
    this.sleepRemaining = this.sleepTotal;
    this.sleepRunning = true;

    this.sleepInterval = setInterval(() => {
      this.sleepRemaining--;

      // Start fade-out in the last 10 seconds
      if (this.sleepRemaining <= 10 && this.sleepRemaining > 0) {
        if (this.sleepRemaining === 10) {
          audioEngine.fadeOutAll(10);
        }
      }

      if (this.sleepRemaining <= 0) {
        this.clearSleep();
        mixer.stopAll();
      }
    }, 1000);
  }

  clearSleep(): void {
    if (this.sleepInterval) {
      clearInterval(this.sleepInterval);
      this.sleepInterval = null;
    }
    this.sleepRunning = false;
    this.sleepRemaining = 0;
    this.sleepTotal = 0;
  }

  // --- Pomodoro Timer ---

  startPomodoro(): void {
    this.clearPomodoro();
    const minutes = this.pomodoroConfig.isBreak
      ? this.pomodoroConfig.breakMinutes
      : this.pomodoroConfig.workMinutes;
    
    this.pomodoroTotal = minutes * 60;
    this.pomodoroRemaining = this.pomodoroTotal;
    this.pomodoroRunning = true;

    this.pomodoroInterval = setInterval(() => {
      this.pomodoroRemaining--;

      if (this.pomodoroRemaining <= 0) {
        this.onPomodoroComplete();
      }
    }, 1000);
  }

  pausePomodoro(): void {
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
    this.pomodoroRunning = false;
  }

  resumePomodoro(): void {
    if (this.pomodoroRemaining <= 0) return;
    this.pomodoroRunning = true;
    this.pomodoroInterval = setInterval(() => {
      this.pomodoroRemaining--;
      if (this.pomodoroRemaining <= 0) {
        this.onPomodoroComplete();
      }
    }, 1000);
  }

  clearPomodoro(): void {
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
    this.pomodoroRunning = false;
    this.pomodoroRemaining = this.pomodoroConfig.workMinutes * 60;
    this.pomodoroTotal = this.pomodoroConfig.workMinutes * 60;
    this.pomodoroConfig = { ...this.pomodoroConfig, isBreak: false };
  }

  setPomodoroConfig(work: number, breakMin: number): void {
    this.pomodoroConfig = {
      workMinutes: work,
      breakMinutes: breakMin,
      isBreak: this.pomodoroConfig.isBreak,
    };
    if (!this.pomodoroRunning) {
      this.pomodoroRemaining = work * 60;
      this.pomodoroTotal = work * 60;
    }
  }

  private onPomodoroComplete(): void {
    this.pausePomodoro();
    // Play alarm sound
    const alarm = new Audio('/sounds/alarm.mp3');
    alarm.play().catch(() => {});

    // Toggle between work and break
    this.pomodoroConfig = {
      ...this.pomodoroConfig,
      isBreak: !this.pomodoroConfig.isBreak,
    };
  }
}

export const timer = new TimerStore();
