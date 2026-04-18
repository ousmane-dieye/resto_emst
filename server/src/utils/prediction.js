import { getDb, saveDatabase } from '../utils/database.js';

export class PredictionEngine {
  constructor() {
    this.historyDays = 30;
    this.weights = {
      weekday: 0.3,
      historique: 0.4,
      creneau: 0.3
    };
  }

  getDayOfWeek(date) {
    return new Date(date).getDay();
  }

  getWeekMultiplier(day) {
    const multipliers = {
      0: 0.5,   // Sunday
      1: 0.8,   // Monday
      2: 0.9,   // Tuesday
      3: 1.0,   // Wednesday
      4: 1.1,   // Thursday
      5: 1.2,   // Friday
      6: 0.7    // Saturday
    };
    return multipliers[day] || 1;
  }

  calculateHistoricalAverage() {
    const db = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentCommandes = db.commandes.filter(c => 
      new Date(c.dateHeure) >= thirtyDaysAgo
    );

    if (recentCommandes.length === 0) {
      return { total: 80, parCreneau: { '12:00-13:30': 50, '07:30-09:00': 15, '13:30-15:00': 10, '09:00-10:30': 5 } };
    }

    const parCreneau = {};
    const creneauxMap = {};
    
    db.creneaux.forEach(c => {
      const key = `${c.heureDebut}-${c.heureFin}`;
      creneauxMap[c.id] = key;
      parCreneau[key] = [];
    });

    recentCommandes.forEach(cmd => {
      const key = creneauxMap[cmd.creneauId];
      if (key && parCreneau[key]) {
        parCreneau[key].push(cmd);
      }
    });

    const averages = {};
    Object.keys(parCreneau).forEach(key => {
      const count = parCreneau[key].length;
      averages[key] = count > 0 ? Math.round(count / 30) : 0;
    });

    const total = Object.values(averages).reduce((s, v) => s + v, 0);

    return { total, parCreneau: averages };
  }

  predict(date = new Date()) {
    const db = getDb();
    const dayOfWeek = this.getDayOfWeek(date);
    const weekMult = this.getWeekMultiplier(dayOfWeek);
    const histo = this.calculateHistoricalAverage();

    const prediction = {
      datePrevision: date.toISOString(),
      Methode: 'statistique',
      parametres: {
        jourSemaine: dayOfWeek,
        coefficientSemaine: weekMult,
        historique30Jours: histo.total
      }
    };

    const previsionParCreneau = {};
    const creneauxMap = {};
    
    db.creneaux.forEach(c => {
      const key = `${c.heureDebut}-${c.heureFin}`;
      creneauxMap[c.id] = key;
      const base = histo.parCreneau[key] || 0;
      const adjusted = Math.round(base * weekMult);
      previsionParCreneau[key] = Math.max(adjusted, 5);
    });

    prediction.nbCouvertsPrevu = Object.values(previsionParCreneau).reduce((s, v) => s + v, 0);
    prediction.previsionParCreneau = previsionParCreneau;
    prediction.tauxConfiance = this.calculateConfidence(histo.total);
    prediction.stocksCritiques = db.stocks
      .filter(s => s.quantite <= s.seuilAlerte)
      .map(s => s.ingredient);
    prediction.surplusDetecte = db.stocks.some(s => s.quantite > s.seuilAlerte * 4);

    return prediction;
  }

  calculateConfidence(historiqueTotal) {
    if (historiqueTotal === 0) return 0.5;
    if (historiqueTotal < 50) return 0.6;
    if (historiqueTotal < 100) return 0.75;
    if (historiqueTotal < 200) return 0.85;
    return 0.92;
  }

  getRecommendations() {
    const db = getDb();
    const prediction = this.predict();
    const recommendations = [];

    if (prediction.nbCouvertsPrevu > 100) {
      recommendations.push({
        type: 'SURCHARGE',
        message: 'Prévision élevée - prévoir plus de personnel',
        priority: 'high'
      });
    }

    if (prediction.stocksCritiques.length > 0) {
      recommendations.push({
        type: 'STOCK',
        message: `Stocks critiques à commander: ${prediction.stocksCritiques.join(', ')}`,
        priority: 'high'
      });
    }

    const creneauxCharges = Object.entries(prediction.previsionParCreneau)
      .filter(([_, v]) => v > 80)
      .map(([k, _]) => k);

    if (creneauxCharges.length > 0) {
      recommendations.push({
        type: 'CRENEAUX',
        message: `Créneaux chargés: ${creneauxCharges.join(', ')}`,
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

export const predictionEngine = new PredictionEngine();