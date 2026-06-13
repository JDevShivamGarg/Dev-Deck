import { getUserConfig, setUserConfig } from '../db/queries/config';
import { getCardsReviewedToday } from '../db/queries/sessions';

export async function checkAndUpdateStreak(totalCardsJustCompleted: number): Promise<void> {
  const dailyGoalStr = await getUserConfig('daily_goal');
  const dailyGoal = dailyGoalStr ? parseInt(dailyGoalStr, 10) : 30;
  
  // getCardsReviewedToday includes the session that just finished because we call this *after* insertSession
  const cardsReviewedToday = await getCardsReviewedToday();
  
  if (cardsReviewedToday >= dailyGoal) {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastGoalMetDate = await getUserConfig('last_goal_met_date');
    
    if (lastGoalMetDate === todayStr) {
      // Already met today
      return;
    }
    
    const currentStreakStr = await getUserConfig('streak_count');
    let currentStreak = currentStreakStr ? parseInt(currentStreakStr, 10) : 0;
    
    if (lastGoalMetDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastGoalMetDate === yesterdayStr) {
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First time meeting goal
      currentStreak = 1;
    }
    
    await setUserConfig('streak_count', currentStreak.toString());
    await setUserConfig('last_goal_met_date', todayStr);
  }
}
