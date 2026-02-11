import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "ro" | "ru";

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "EventFlow",
    "app.tagline": "Entertainment Center Management",

    "nav.myTickets": "My Tickets",
    "nav.venueMap": "Venue Map",
    "nav.directions": "Directions",
    "nav.parking": "Parking",
    "nav.scanner": "Scanner",
    "nav.monitoring": "Monitoring",
    "nav.overview": "Overview",
    "nav.analytics": "Analytics",
    "nav.aiInsights": "AI Insights",

    "role.spectator": "Spectator",
    "role.staff": "Staff",
    "role.organizer": "Organizer",
    "role.select": "Select Your Role",
    "role.selectDesc": "Choose how you want to interact with the event",
    "role.switchRole": "Switch Role",

    "tickets.title": "My Tickets",
    "tickets.noEvents": "No Events Yet",
    "tickets.noEventsDesc": "Create demo data to get started.",
    "tickets.createDemo": "Create Demo Event",
    "tickets.creating": "Creating...",
    "tickets.noTickets": "No tickets found for this event.",
    "tickets.tryDemo": "Try Demo Mode to explore ticket lifecycle features.",
    "tickets.demoMode": "Demo Mode",
    "tickets.exitDemo": "Exit Demo",
    "tickets.demoActive": "Demo Mode Active",
    "tickets.demoDesc": "4 demo tickets created. Use the buttons to simulate lifecycle transitions.",
    "tickets.lifecycle": "Ticket Lifecycle Demo",
    "tickets.lifecycleDesc": "Simulate ticket status transitions: Pending, Valid, Used, Invalid",
    "tickets.finalState": "Final state reached",
    "tickets.activate": "Activate",
    "tickets.scan": "Scan (Use)",
    "tickets.invalidate": "Invalidate",
    "tickets.markInvalid": "Mark Invalid",

    "tickets.availability": "Ticket Availability",
    "tickets.availabilityDesc": "Real-time pricing and availability",
    "tickets.available": "available",
    "tickets.sold": "sold",
    "tickets.upgrade": "Upgrade",
    "tickets.upgradeTitle": "Upgrade Ticket",
    "tickets.upgradeDesc": "Select a new category for your ticket. The price difference will be shown.",
    "tickets.currentCategory": "Current",
    "tickets.priceDifference": "Price difference",
    "tickets.confirmUpgrade": "Confirm Upgrade",
    "tickets.upgrading": "Upgrading...",
    "tickets.upgraded": "Ticket Upgraded",
    "tickets.upgradeFailed": "Upgrade Failed",
    "tickets.upgradeFailedDesc": "Could not upgrade ticket. Please try again.",
    "tickets.cancel": "Cancel",

    "directions.title": "Directions to Venue",
    "directions.searchPlaceholder": "Search location...",
    "directions.car": "Car",
    "directions.walk": "Walking",
    "directions.transit": "Public Transport",
    "directions.duration": "Duration",
    "directions.distance": "Distance",

    "parking.title": "Parking",
    "parking.available": "Available Spots",
    "parking.full": "Full",
    "parking.open": "Open",
    "parking.closed": "Closed",

    "scanner.title": "Ticket Scanner",
    "scanner.demoMode": "Demo Mode",
    "scanner.scanHistory": "Scan History",
    "scanner.enterCode": "Enter ticket code",

    "monitoring.title": "Live Monitoring",
    "monitoring.entryFeed": "Entry/Exit Feed",
    "monitoring.alerts": "Active Alerts",

    "overview.title": "Event Overview",
    "overview.totalTickets": "Total Tickets",
    "overview.attendance": "Attendance",
    "overview.parkingUsed": "Parking Used",

    "analytics.title": "Analytics",
    "analytics.entryFlow": "Entry/Exit Flow",
    "analytics.zoneUtilization": "Zone Utilization",
    "analytics.parkingUtilization": "Parking Utilization",
    "analytics.ticketDistribution": "Ticket Distribution",

    "ai.title": "AI Insights",
    "ai.generate": "Generate Recommendations",
    "ai.generating": "Analyzing...",
    "ai.confidence": "Confidence",
    "ai.apply": "Apply",
    "ai.applied": "Applied",

    "map.title": "Venue Map",
    "map.zones": "Zones",
    "map.occupancy": "Occupancy",

    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.login": "Log in with Replit",
    "common.welcome": "Welcome to EventFlow",
    "common.welcomeDesc": "Real-time event management with AI-powered insights",
  },
  ro: {
    "app.name": "EventFlow",
    "app.tagline": "Sistem de Management al Centrelor de Divertisment",

    "nav.myTickets": "Biletele Mele",
    "nav.venueMap": "Harta Locației",
    "nav.directions": "Direcții",
    "nav.parking": "Parcare",
    "nav.scanner": "Scanner",
    "nav.monitoring": "Monitorizare",
    "nav.overview": "Prezentare",
    "nav.analytics": "Analiză",
    "nav.aiInsights": "Analiză AI",

    "role.spectator": "Spectator",
    "role.staff": "Personal",
    "role.organizer": "Organizator",
    "role.select": "Selectează Rolul",
    "role.selectDesc": "Alege cum vrei să interacționezi cu evenimentul",
    "role.switchRole": "Schimbă Rolul",

    "tickets.title": "Biletele Mele",
    "tickets.noEvents": "Niciun Eveniment",
    "tickets.noEventsDesc": "Creează date demo pentru a începe.",
    "tickets.createDemo": "Creează Eveniment Demo",
    "tickets.creating": "Se creează...",
    "tickets.noTickets": "Nu s-au găsit bilete pentru acest eveniment.",
    "tickets.tryDemo": "Încearcă Modul Demo pentru a explora funcțiile ciclului de viață al biletelor.",
    "tickets.demoMode": "Mod Demo",
    "tickets.exitDemo": "Ieși din Demo",
    "tickets.demoActive": "Mod Demo Activ",
    "tickets.demoDesc": "4 bilete demo create. Folosește butoanele pentru a simula tranzițiile de stare.",
    "tickets.lifecycle": "Demo Ciclu de Viață Bilete",
    "tickets.lifecycleDesc": "Simulează tranzițiile de stare: În așteptare, Valid, Utilizat, Invalid",
    "tickets.finalState": "Stare finală atinsă",
    "tickets.activate": "Activează",
    "tickets.scan": "Scanează (Utilizare)",
    "tickets.invalidate": "Invalidează",
    "tickets.markInvalid": "Marchează Invalid",

    "tickets.availability": "Disponibilitate Bilete",
    "tickets.availabilityDesc": "Prețuri și disponibilitate în timp real",
    "tickets.available": "disponibile",
    "tickets.sold": "vândute",
    "tickets.upgrade": "Upgrade",
    "tickets.upgradeTitle": "Upgrade Bilet",
    "tickets.upgradeDesc": "Selectează o nouă categorie pentru biletul tău. Diferența de preț va fi afișată.",
    "tickets.currentCategory": "Curent",
    "tickets.priceDifference": "Diferența de preț",
    "tickets.confirmUpgrade": "Confirmă Upgrade",
    "tickets.upgrading": "Se face upgrade...",
    "tickets.upgraded": "Bilet Upgradat",
    "tickets.upgradeFailed": "Upgrade Eșuat",
    "tickets.upgradeFailedDesc": "Nu s-a putut face upgrade la bilet. Încearcă din nou.",
    "tickets.cancel": "Anulează",

    "directions.title": "Direcții către Locație",
    "directions.searchPlaceholder": "Caută locația...",
    "directions.car": "Mașină",
    "directions.walk": "Pe jos",
    "directions.transit": "Transport Public",
    "directions.duration": "Durată",
    "directions.distance": "Distanță",

    "parking.title": "Parcare",
    "parking.available": "Locuri Disponibile",
    "parking.full": "Plin",
    "parking.open": "Deschis",
    "parking.closed": "Închis",

    "scanner.title": "Scanner Bilete",
    "scanner.demoMode": "Mod Demo",
    "scanner.scanHistory": "Istoric Scanări",
    "scanner.enterCode": "Introduceți codul biletului",

    "monitoring.title": "Monitorizare Live",
    "monitoring.entryFeed": "Flux Intrări/Ieșiri",
    "monitoring.alerts": "Alerte Active",

    "overview.title": "Prezentare Eveniment",
    "overview.totalTickets": "Total Bilete",
    "overview.attendance": "Prezență",
    "overview.parkingUsed": "Parcare Utilizată",

    "analytics.title": "Analiză",
    "analytics.entryFlow": "Flux Intrări/Ieșiri",
    "analytics.zoneUtilization": "Utilizare Zone",
    "analytics.parkingUtilization": "Utilizare Parcare",
    "analytics.ticketDistribution": "Distribuția Biletelor",

    "ai.title": "Analiză AI",
    "ai.generate": "Generează Recomandări",
    "ai.generating": "Se analizează...",
    "ai.confidence": "Încredere",
    "ai.apply": "Aplică",
    "ai.applied": "Aplicat",

    "map.title": "Harta Locației",
    "map.zones": "Zone",
    "map.occupancy": "Ocupare",

    "common.loading": "Se încarcă...",
    "common.error": "A apărut o eroare",
    "common.save": "Salvează",
    "common.delete": "Șterge",
    "common.edit": "Editează",
    "common.close": "Închide",
    "common.login": "Autentifică-te cu Replit",
    "common.welcome": "Bine ai venit la EventFlow",
    "common.welcomeDesc": "Management de evenimente în timp real cu analiză bazată pe AI",
  },
  ru: {
    "app.name": "EventFlow",
    "app.tagline": "Система управления развлекательными центрами",

    "nav.myTickets": "Мои Билеты",
    "nav.venueMap": "Карта Места",
    "nav.directions": "Маршруты",
    "nav.parking": "Парковка",
    "nav.scanner": "Сканер",
    "nav.monitoring": "Мониторинг",
    "nav.overview": "Обзор",
    "nav.analytics": "Аналитика",
    "nav.aiInsights": "AI Анализ",

    "role.spectator": "Зритель",
    "role.staff": "Персонал",
    "role.organizer": "Организатор",
    "role.select": "Выберите Роль",
    "role.selectDesc": "Выберите, как вы хотите взаимодействовать с мероприятием",
    "role.switchRole": "Сменить Роль",

    "tickets.title": "Мои Билеты",
    "tickets.noEvents": "Нет Мероприятий",
    "tickets.noEventsDesc": "Создайте демо-данные для начала.",
    "tickets.createDemo": "Создать Демо Мероприятие",
    "tickets.creating": "Создание...",
    "tickets.noTickets": "Билеты для этого мероприятия не найдены.",
    "tickets.tryDemo": "Попробуйте Демо Режим для изучения функций жизненного цикла билетов.",
    "tickets.demoMode": "Демо Режим",
    "tickets.exitDemo": "Выход из Демо",
    "tickets.demoActive": "Демо Режим Активен",
    "tickets.demoDesc": "Создано 4 демо-билета. Используйте кнопки для имитации переходов состояний.",
    "tickets.lifecycle": "Демо Жизненного Цикла Билета",
    "tickets.lifecycleDesc": "Имитация переходов состояний: Ожидание, Действителен, Использован, Недействителен",
    "tickets.finalState": "Достигнуто финальное состояние",
    "tickets.activate": "Активировать",
    "tickets.scan": "Сканировать (Использовать)",
    "tickets.invalidate": "Аннулировать",
    "tickets.markInvalid": "Отметить Недействительным",

    "tickets.availability": "Доступность Билетов",
    "tickets.availabilityDesc": "Цены и доступность в реальном времени",
    "tickets.available": "доступно",
    "tickets.sold": "продано",
    "tickets.upgrade": "Повысить",
    "tickets.upgradeTitle": "Повысить Билет",
    "tickets.upgradeDesc": "Выберите новую категорию для вашего билета. Разница в цене будет показана.",
    "tickets.currentCategory": "Текущая",
    "tickets.priceDifference": "Разница в цене",
    "tickets.confirmUpgrade": "Подтвердить Повышение",
    "tickets.upgrading": "Повышение...",
    "tickets.upgraded": "Билет Повышен",
    "tickets.upgradeFailed": "Ошибка Повышения",
    "tickets.upgradeFailedDesc": "Не удалось повысить билет. Попробуйте снова.",
    "tickets.cancel": "Отмена",

    "directions.title": "Маршрут до Места",
    "directions.searchPlaceholder": "Поиск локации...",
    "directions.car": "Авто",
    "directions.walk": "Пешком",
    "directions.transit": "Общ. Транспорт",
    "directions.duration": "Время",
    "directions.distance": "Расстояние",

    "parking.title": "Парковка",
    "parking.available": "Свободных Мест",
    "parking.full": "Заполнена",
    "parking.open": "Открыта",
    "parking.closed": "Закрыта",

    "scanner.title": "Сканер Билетов",
    "scanner.demoMode": "Демо Режим",
    "scanner.scanHistory": "История Сканирований",
    "scanner.enterCode": "Введите код билета",

    "monitoring.title": "Мониторинг в Реальном Времени",
    "monitoring.entryFeed": "Поток Входов/Выходов",
    "monitoring.alerts": "Активные Оповещения",

    "overview.title": "Обзор Мероприятия",
    "overview.totalTickets": "Всего Билетов",
    "overview.attendance": "Посещаемость",
    "overview.parkingUsed": "Парковка Занята",

    "analytics.title": "Аналитика",
    "analytics.entryFlow": "Поток Входов/Выходов",
    "analytics.zoneUtilization": "Загрузка Зон",
    "analytics.parkingUtilization": "Загрузка Парковки",
    "analytics.ticketDistribution": "Распределение Билетов",

    "ai.title": "AI Анализ",
    "ai.generate": "Сгенерировать Рекомендации",
    "ai.generating": "Анализ...",
    "ai.confidence": "Уверенность",
    "ai.apply": "Применить",
    "ai.applied": "Применено",

    "map.title": "Карта Места",
    "map.zones": "Зоны",
    "map.occupancy": "Заполненность",

    "common.loading": "Загрузка...",
    "common.error": "Произошла ошибка",
    "common.save": "Сохранить",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.close": "Закрыть",
    "common.login": "Войти через Replit",
    "common.welcome": "Добро пожаловать в EventFlow",
    "common.welcomeDesc": "Управление мероприятиями в реальном времени с AI-аналитикой",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("eventflow-language");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("eventflow-language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "ro", label: "Română", flag: "RO" },
  { code: "ru", label: "Русский", flag: "RU" },
];
