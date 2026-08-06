import { firebaseService } from "./firebase-service.js";

const defaultCategories = [
  { name: "Housing", bucket: "essential", monthlyBudget: 0, color: "#0f766e" },
  { name: "Groceries", bucket: "essential", monthlyBudget: 0, color: "#15803d" },
  { name: "Transport", bucket: "essential", monthlyBudget: 0, color: "#2563eb" },
  { name: "Dining", bucket: "discretionary", monthlyBudget: 0, color: "#b7791f" },
  { name: "Entertainment", bucket: "discretionary", monthlyBudget: 0, color: "#7c3aed" },
  { name: "Savings", bucket: "savings", monthlyBudget: 0, color: "#db2777" }
];

export const state = {
  user: null,
  income: { fixedIncome: 0, extraIncome: 0 },
  emis: [],
  transactions: [],
  categories: [],
  goals: [],
  unsubscribers: []
};

export function clearSubscriptions() {
  state.unsubscribers.forEach((unsubscribe) => unsubscribe());
  state.unsubscribers = [];
}

export function subscribeToUserData(uid, render) {
  clearSubscriptions();

  state.unsubscribers = [
    firebaseService.watchDoc(uid, "settings", "income", (income) => {
      state.income = income || { fixedIncome: 0, extraIncome: 0 };
      render();
    }),
    firebaseService.watchCollection(uid, "emis", (emis) => {
      state.emis = emis;
      render();
    }),
    firebaseService.watchCollection(uid, "transactions", (transactions) => {
      state.transactions = transactions;
      render();
    }),
    firebaseService.watchCollection(uid, "categories", async (categories) => {
      state.categories = categories;
      render();

      if (categories.length === 0) {
        await Promise.all(defaultCategories.map((category) => firebaseService.add(uid, "categories", category)));
      }
    }),
    firebaseService.watchCollection(uid, "goals", (goals) => {
      state.goals = goals;
      render();
    })
  ];
}

export const actions = {
  saveIncome(uid, income) {
    return firebaseService.set(uid, "settings", "income", income);
  },

  saveEmi(uid, id, emi) {
    return id ? firebaseService.update(uid, "emis", id, emi) : firebaseService.add(uid, "emis", emi);
  },

  deleteEmi(uid, id) {
    return firebaseService.remove(uid, "emis", id);
  },

  saveTransaction(uid, id, transaction) {
    return id
      ? firebaseService.update(uid, "transactions", id, transaction)
      : firebaseService.add(uid, "transactions", transaction);
  },

  deleteTransaction(uid, id) {
    return firebaseService.remove(uid, "transactions", id);
  },

  addCategory(uid, category) {
    return firebaseService.add(uid, "categories", category);
  },

  deleteCategory(uid, id) {
    return firebaseService.remove(uid, "categories", id);
  },

  saveGoal(uid, id, goal) {
    return id ? firebaseService.update(uid, "goals", id, goal) : firebaseService.add(uid, "goals", goal);
  },

  deleteGoal(uid, id) {
    return firebaseService.remove(uid, "goals", id);
  }
};
