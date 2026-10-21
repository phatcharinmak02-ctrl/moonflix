import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clapperboard,
  Clock3,
  Globe2,
  History,
  Menu,
  Languages,
  LoaderCircle,
  Moon,
  PanelLeftClose,
  Search,
  Sparkles,
  Star,
  Sun,
  Tv,
  Trash2,
  X,
} from "lucide-react";
import { authRequest, clearAuthTokens, getAccessToken, localApiFetch, saveAuthResult } from "./auth";

const popularGenres = [
  "Action",
  "Adventure",
  "Anime",
  "Children",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Science-Fiction",
  "Thriller",
];
const searchHistoryKey = "series-finder-search-history";
const maxSearchHistory = 8;
const noGenreCategory = "__series_finder_no_genre__";
const translations = {
  th: {
    documentTitle: "Series Finder — ค้นพบซีรีส์เรื่องโปรด",
    toggleLanguage: "เปลี่ยนภาษาเป็นอังกฤษ", toggleTheme: "เปลี่ยนธีม",
    searchLabel: "ค้นหาซีรีส์", searchPlaceholder: "ค้นหาชื่อซีรีส์ เช่น Batman, Friends...",
    search: "ค้นหา", searching: "กำลังค้นหา", searchNow: "เริ่มค้นหา", home: "Series Finder หน้าหลัก",
    backToCatalog: "กลับไปยังซีรีส์ทั้งหมด",
    searchHistory: "ประวัติการค้นหา",
    clearHistory: "ล้างประวัติ", predictions: "คำแนะนำจาก TVmaze",
    startTitle: "เริ่มต้นค้นหาซีรีส์ที่คุณชอบ",
    startHint: "พิมพ์ชื่อซีรีส์ด้านบน หรือเลือกคำค้นหายอดนิยมได้เลย",
    noYear: "ไม่ระบุปี", noLanguage: "ไม่ระบุภาษา", noGenre: "ไม่ระบุประเภท",
    details: "ดูรายละเอียด", noSummary: "ยังไม่มีเรื่องย่อสำหรับซีรีส์เรื่องนี้",
    categories: "ประเภทซีรีส์", allCategories: "ทุกประเภท", noGenreMatches: "ไม่มีประเภทนี้ในผลค้นหา",
    searchForCategories: "ค้นหาซีรีส์ก่อน แล้วเลือกประเภทที่ต้องการ",
    filteredCount: (count, genre) => `${count} เรื่อง · ${genre}`,
    browseCategories: "เลือกประเภทเพื่อค้นหาซีรีส์",
    categoryResults: (genre) => `ซีรีส์ประเภท ${genre}`,
    platforms: "แพลตฟอร์ม", allPlatforms: "ทุกแพลตฟอร์ม",
    catalogTitle: "ซีรีส์ทั้งหมด",
    loadingShows: "กำลังโหลดซีรีส์...",
    loadMore: "โหลดซีรีส์เพิ่มเติม",
    loadingMore: "กำลังโหลด...",
    loadedCount: (count) => `แสดง ${count} เรื่อง`,
    noCatalogResults: "ไม่พบซีรีส์ที่ตรงกับตัวกรองนี้",
    year: "ปีที่ออกอากาศ", language: "ภาษา", rating: "คะแนน", noRating: "ไม่มีคะแนน",
    status: "สถานะ", summary: "เรื่องย่อ", officialSite: "เว็บไซต์ทางการ",
    emptyQuery: "กรุณาพิมพ์ชื่อซีรีส์ก่อนค้นหา", invalidData: "ได้รับข้อมูลจากระบบค้นหาไม่ถูกต้อง",
    searchError: "เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่", errorTitle: "ค้นหาไม่สำเร็จ",
    retry: "ลองอีกครั้ง", results: "ผลการค้นหา",
    matching: (query) => `ซีรีส์ที่ตรงกับ “${query}”`,
    notFound: (query) => `ไม่พบซีรีส์ที่ตรงกับ “${query}”`,
    count: (count) => `${count} รายการ`,
    noResultsHint: "ลองตรวจสอบการสะกด หรือค้นหาด้วยชื่ออื่นดูนะ",
    source: "ค้นหาข้อมูลซีรีส์ด้วย", closeDetails: "ปิดรายละเอียด",
    posterAlt: (name) => `โปสเตอร์ ${name}`,
  },
  en: {
    documentTitle: "Series Finder — Discover your next favorite series",
    toggleLanguage: "Switch language to Thai", toggleTheme: "Toggle theme",
    searchLabel: "Search series", searchPlaceholder: "Search series, e.g. Batman, Friends...",
    search: "Search", searching: "Searching", searchNow: "Search series", home: "Series Finder home",
    backToCatalog: "Back to all series",
    searchHistory: "Recent searches",
    clearHistory: "Clear history", predictions: "Suggestions from TVmaze",
    startTitle: "Start exploring series you love",
    startHint: "Type a series name above or choose a popular search.",
    noYear: "Year unknown", noLanguage: "Language unknown", noGenre: "Genre unknown",
    details: "Details", noSummary: "No summary is available for this series yet.",
    categories: "Series genres", allCategories: "All genres", noGenreMatches: "No series in this genre",
    searchForCategories: "Search for a series to filter by genre.",
    filteredCount: (count, genre) => `${count} shows · ${genre}`,
    browseCategories: "Choose a genre to discover series",
    categoryResults: (genre) => `${genre} series`,
    platforms: "Platforms", allPlatforms: "All platforms",
    catalogTitle: "All series",
    loadingShows: "Loading series...",
    loadMore: "Load more series",
    loadingMore: "Loading...",
    loadedCount: (count) => `Showing ${count} series`,
    noCatalogResults: "No series match these filters.",
    year: "Aired", language: "Language", rating: "Rating", noRating: "Not rated",
    status: "Status", summary: "Summary", officialSite: "Official website",
    emptyQuery: "Enter a series name to search.", invalidData: "The search service returned invalid data.",
    searchError: "Search failed. Please try again.", errorTitle: "Search failed",
    retry: "Try again", results: "Search results",
    matching: (query) => `Series matching “${query}”`,
    notFound: (query) => `No series found for “${query}”`,
    count: (count) => `${count} results`,
    noResultsHint: "Check the spelling or try searching for another title.",
    source: "Series data from", closeDetails: "Close details",
    posterAlt: (name) => `${name} poster`,
  },
};

function readSearchHistory() {
  try {
    const storedHistory = JSON.parse(localStorage.getItem(searchHistoryKey) || "[]");
    return Array.isArray(storedHistory)
      ? storedHistory.filter((item) => typeof item === "string")
      : [];
  } catch (error) {
    console.error("Could not read search history:", error);
    return [];
  }
}

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    const validValues = key === "series-finder-language" ? ["th", "en"] : ["dark", "light"];
    return validValues.includes(value) ? value : fallback;
  } catch (error) {
    console.error(`Could not read preference "${key}":`, error);
    return fallback;
  }
}

function getYear(show, language) {
  const premiered = show.premiered?.slice(0, 4);
  const ended = show.ended?.slice(0, 4);
  if (premiered && ended && premiered !== ended) return `${premiered}–${ended}`;
  if (premiered) return premiered;
  return show.status || translations[language].noYear;
}

function getSummary(summary, language) {
  if (!summary) return translations[language].noSummary;
  return summary.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getPlatform(show) {
  return show.network?.name || show.webChannel?.name || "";
}

function ShowCard({ show, onSelect, language, text }) {
  const image = show.image?.medium || show.image?.original;
  const genres = show.genres?.length ? show.genres : [text.noGenre];

  return (
    <button
      type="button"
      onClick={() => onSelect(show)}
      className="group w-full overflow-hidden rounded-[1.35rem] border border-purple-100/80 bg-white text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-glow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-200 dark:border-slate-700 dark:bg-slate-900"
      aria-label={`${text.details}: ${show.name}`}
    >
      <div className="poster-background relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={text.posterAlt(show.name)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-purple-300">
            <Clapperboard size={46} strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-70" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
          <CalendarDays size={13} className="text-purple-600" />
          {getYear(show, language)}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          {show.rating?.average ?? "—"}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <h2 className="truncate text-lg font-bold tracking-tight text-ink group-hover:text-purple-700 dark:text-slate-100">
          {show.name}
        </h2>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Languages size={14} className="shrink-0 text-purple-500" />
          <span>{show.language || text.noLanguage}</span>
        </div>
        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
          {genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700"
            >
              {genre}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400 dark:border-slate-700">
          <span>{show.network?.name || show.webChannel?.name || "TVmaze"}</span>
          <span className="inline-flex items-center gap-1 text-purple-600 transition group-hover:gap-2">
            {text.details} <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

function ShowDialog({ show, onClose, language, text, isMember }) {
  const closeButton = useRef(null);
  const image = show.image?.original || show.image?.medium;

  useEffect(() => {
    closeButton.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="show-dialog-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem] dark:bg-slate-900"
      >
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-ink shadow transition hover:bg-white hover:text-purple-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label={text.closeDetails}
        >
          <X size={20} />
        </button>
        <div className="relative h-56 overflow-hidden bg-purple-100 sm:h-72">
          {image ? (
            <img
              src={image}
              alt={text.posterAlt(show.name)}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-purple-300">
              <Clapperboard size={64} strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
            <div className="mb-2 flex flex-wrap gap-2">
              {show.genres?.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                >
                  {genre}
                </span>
              ))}
            </div>
            <h2 id="show-dialog-title" className="text-3xl font-extrabold text-white">
              {show.name}
            </h2>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [text.year, getYear(show, language)],
              [text.language, show.language || text.noLanguage],
              [text.rating, show.rating?.average ?? text.noRating],
              [text.status, show.status || text.noYear],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-purple-50/80 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 font-bold text-ink dark:text-slate-100">{value}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            {text.summary}
          </h3>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
            {getSummary(show.summary, language)}
          </p>
          {show.officialSite && isMember && (
            <a
              href={show.officialSite}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700"
            >
              {text.officialSite} <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function App() {
  const registrationGenres = ["Action", "Adventure", "Anime", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Science-Fiction", "Thriller"];
  const [registrationStep, setRegistrationStep] = useState(null);
  const [registration, setRegistration] = useState({ firstName: "", lastName: "", email: "", gender: "", genderOther: "", day: "", month: "", year: "", password: "", confirmPassword: "", genres: [] });
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [language, setLanguage] = useState(() => readPreference("series-finder-language", "th"));
  const [theme, setTheme] = useState(() => readPreference("series-finder-theme", "light"));
  const [query, setQuery] = useState("");
  const [shows, setShows] = useState([]);
  const [catalogPage, setCatalogPage] = useState(0);
  const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isBrowsingGenre, setIsBrowsingGenre] = useState(false);
  const [searchedFor, setSearchedFor] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [notice, setNotice] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [searchHistory, setSearchHistory] = useState(readSearchHistory);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [activePrediction, setActivePrediction] = useState(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const predictionListRef = useRef(null);
  const catalogSnapshotRef = useRef(null);
  const text = translations[language];
  const registrationText = language === "th"
    ? { join: "สมัครสมาชิก", title: "สร้างบัญชีของคุณ", subtitle: "กรอกข้อมูลเพื่อเริ่มค้นหาซีรีส์ที่ใช่", personal: "ข้อมูลสมาชิก", name: "ชื่อ", surname: "นามสกุล", gender: "เพศ", male: "ชาย", female: "หญิง", other: "อื่นๆ", specify: "โปรดระบุเพศ", birthday: "วันเกิด", day: "วัน", month: "เดือน", year: "ปี", age: "อายุ", password: "ตั้งรหัสผ่าน", confirmPassword: "ยืนยันรหัสผ่าน", passwordHint: "รหัสผ่านต้องมีอย่างน้อย 8 ตัว และมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น ! @ # $ %", passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", mismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง", specialRequired: "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว", next: "ถัดไป", back: "ย้อนกลับ", choose: "เลือกแนวที่คุณชอบ", chooseHint: "เลือก 5 แนวจาก 15 แนว เพื่อปรับคำแนะนำซีรีส์ให้ตรงใจ", selected: "เลือกแล้ว", finish: "สมัครสมาชิก", success: "สมัครสมาชิกเรียบร้อยแล้ว!", saved: "ข้อมูลสมาชิกและแนวซีรีส์ที่ชอบบันทึกไว้ในอุปกรณ์นี้แล้ว", return: "กลับไปค้นหาซีรีส์", required: "กรุณากรอกข้อมูลให้ครบและถูกต้อง", needFive: "กรุณาเลือกแนวที่ชอบให้ครบ 5 แนว", select: "เลือก" }
    : { join: "Sign up", title: "Create your account", subtitle: "Tell us a little about yourself to get started.", personal: "Your details", name: "First name", surname: "Last name", gender: "Gender", male: "Male", female: "Female", other: "Other", specify: "Please specify", birthday: "Date of birth", day: "Day", month: "Month", year: "Year", age: "Age", password: "Create password", confirmPassword: "Confirm password", passwordHint: "Use at least 8 characters and include one special character, such as ! @ # $ %", passwordTooShort: "Password must be at least 8 characters.", mismatch: "Passwords do not match. Please enter them again.", specialRequired: "Password must contain at least one special character.", next: "Continue", back: "Back", choose: "Choose your favorite genres", chooseHint: "Pick 5 of 15 genres to personalize your series recommendations.", selected: "Selected", finish: "Create account", success: "You’re all signed up!", saved: "Your details and favorite genres have been saved on this device.", return: "Back to series finder", required: "Please complete all required fields with valid information.", needFive: "Please choose exactly 5 favorite genres.", select: "Choose" };
  const passwordEnglishLetterHint = language === "th" ? "และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว" : "Include at least one English letter.";
  const passwordEnglishLetterError = language === "th" ? "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว" : "Password must contain at least one English letter.";
  registrationText.saved = language === "th" ? "บันทึกข้อมูลสมาชิกและแนวหนังที่ชอบลงฐานข้อมูลแล้ว" : "Your profile and favorite genres are saved to the database.";
  const authText = language === "th"
    ? { username: "ชื่อผู้ใช้", passwordLabel: "รหัสผ่าน", usernameHint: "ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข . _ - จำนวน 3–24 ตัว", login: "เข้าสู่ระบบ", loginTitle: "กรอกข้อมูลเพื่อเข้าสู่ระบบ", loginHint: "ป้อนชื่อผู้ใช้และรหัสผ่านของคุณ", loginError: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", networkError: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง", noAccount: "ยังไม่มีบัญชี?", register: "สมัครสมาชิก", duplicate: "ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น" }
    : { username: "Username", passwordLabel: "Password", usernameHint: "Use 3–24 letters, numbers, dots, underscores, or hyphens.", login: "Log in", loginTitle: "Welcome back", loginHint: "Sign in to continue to the home page.", loginError: "Username or password is incorrect.", networkError: "Could not connect. Please try again.", noAccount: "New here?", register: "Create an account", duplicate: "That username is already taken." };
  authText.username = language === "th" ? "อีเมล" : "Email";
  authText.usernameHint = language === "th" ? "กรอกอีเมลที่ใช้งานได้" : "Enter a valid email address.";
  authText.emailHint = authText.usernameHint;
  authText.loginHint = language === "th" ? "ป้อนอีเมลและรหัสผ่านของคุณ" : "Sign in with your email and password.";
  authText.loginError = language === "th" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : "Email or password is incorrect.";
  authText.duplicate = language === "th" ? "อีเมลนี้ถูกใช้สมัครแล้ว" : "That email is already registered.";
  const guestText = language === "th"
    ? { backHome: "กลับไปหน้าแรก" }
    : { backHome: "Back to home" };
  const months = language === "th" ? ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const daysInBirthMonth = registration.month && registration.year ? new Date(Number(registration.year), Number(registration.month), 0).getDate() : 31;
  const calculatedAge = registration.day && registration.month && registration.year ? (() => { const today = new Date(); let age = today.getFullYear() - Number(registration.year); if (today.getMonth() + 1 < Number(registration.month) || (today.getMonth() + 1 === Number(registration.month) && today.getDate() < Number(registration.day))) age--; return age >= 0 ? age : null; })() : null;
  function updateRegistration(key, value) { setRegistration((current) => ({ ...current, [key]: value, ...(key === "month" || key === "year" ? { day: Number(current.day) > new Date(Number(key === "year" ? value : current.year), Number(key === "month" ? value : current.month), 0).getDate() ? "" : current.day } : {}) })); setRegistrationError(""); }
  function continueRegistration(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email.trim())) { setRegistrationError(authText.emailHint); return; }
    if (registration.password.length < 8) { setRegistrationError(registrationText.passwordTooShort); return; }
    if (registration.password !== registration.confirmPassword) { setRegistrationError(registrationText.mismatch); return; }
    if (!/[A-Za-z]/.test(registration.password)) { setRegistrationError(passwordEnglishLetterError); return; }
    if (!/[!@#$%^&*(),.?":{}|<>_+=\\[\]~-]/.test(registration.password)) { setRegistrationError(registrationText.specialRequired); return; }
    if (!registration.firstName.trim()) { setRegistrationError(registrationText.required); return; }
    setRegistrationError("");
    void finishRegistration();
  }
  async function finishRegistration() {
    const name = registration.firstName.trim();
    if (isRegistering) return;
    setIsRegistering(true);
    try {
      const result = await authRequest("/auth/register", { method: "POST", body: JSON.stringify({ email: registration.email.trim(), password: registration.password, name }) });
      saveAuthResult(result);
      setRegistration((current) => ({ ...current, password: "", confirmPassword: "" }));
      setAccountNotice(language === "th" ? "สมัครสมาชิกเรียบร้อยแล้ว ยินดีต้อนรับสู่หน้าแรก" : "Registration complete. Welcome to the home page.");
      setAuthenticatedUser(result.user); setLoginOpen(false); setRegistrationComplete(false); setRegistrationError(""); setRegistrationStep(null);
    } catch (error) { console.error("Could not create account:", error); setRegistrationError(error.response?.data?.error?.details?.map(({ message }) => message).join(" ") || error.response?.data?.error?.message || authText.networkError); }
    finally { setIsRegistering(false); }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setIsLoggingIn(true); setLoginError("");
    try {
      const result = await authRequest("/auth/login", { method: "POST", body: JSON.stringify(login) });
      saveAuthResult(result);
      setAuthenticatedUser(result.user); setLoginOpen(false); setLogin({ email: "", password: "" });
    } catch (error) { console.error("Could not sign in:", error); setLoginError(error.response?.data?.error?.message || authText.networkError); }
    finally { setIsLoggingIn(false); }
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem("series-finder-refresh-token");
      if (refreshToken) await authRequest("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
    } catch (error) { console.error("Could not end API session:", error); }
    clearAuthTokens();
    setAuthenticatedUser(null); setLoginOpen(false); setShows([]); setStatus("idle"); setError(""); setIsMobileMenuOpen(false); setIsMobileSearchOpen(false);
  }

  function handleExpiredSession(showSignup = false) {
    setAuthenticatedUser(null); setLoginOpen(false); setRegistrationStep(showSignup ? 1 : null); setRegistrationError(""); setShows([]); setStatus("idle"); setError(""); setIsMobileMenuOpen(false); setIsMobileSearchOpen(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try { if (getAccessToken()) { const user = await authRequest("/auth/me"); if (!cancelled) { setAuthenticatedUser(user); setLoginOpen(false); } } }
      catch (sessionError) { console.error("Could not restore API session:", sessionError); }
      finally { if (!cancelled) setIsCheckingSession(false); }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleInvalidAuth(event) {
      setAuthenticatedUser(null);
      setLoginOpen(true);
      setLoginError(event.detail?.message || authText.loginError);
      setShows([]); setStatus("idle");
    }
    window.addEventListener("series-finder-auth-invalid", handleInvalidAuth);
    return () => window.removeEventListener("series-finder-auth-invalid", handleInvalidAuth);
  }, [authText.loginError]);

  useEffect(() => {
    let cancelled = false;
    if (isCheckingSession) {
      return () => { cancelled = true; };
    }
    async function loadInitialCatalog() {
      setStatus("loading");
      try {
        const response = authenticatedUser ? await localApiFetch("/api/shows?page=0") : await fetch("/api/shows/preview?page=0");
        const data = await response.json();
        if (response.status === 401) { if (!cancelled) handleExpiredSession(); return; }
        if (!response.ok) {
          throw new Error(data.error || text.searchError);
        }
        if (!Array.isArray(data)) {
          throw new Error(text.invalidData);
        }
        if (cancelled) return;
        setShows(data);
        setSearchedFor("");
        setSelectedGenre("");
        setSelectedPlatform("");
        setIsBrowsingGenre(false);
        setCatalogPage(0);
        setHasMoreCatalog(data.length > 0);
        setStatus("success");
      } catch (catalogError) {
        if (!cancelled) {
          setError(catalogError.message || text.searchError);
          setStatus("error");
        }
      }
    }
    loadInitialCatalog();
    return () => {
      cancelled = true;
    };
  }, [authenticatedUser, isCheckingSession, language]);

  useEffect(() => {
    if (isMobileSearchOpen) searchInputRef.current?.focus();
  }, [isMobileSearchOpen]);

  useEffect(() => {
    function closeMobileMenu(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
      }
    }
    window.addEventListener("keydown", closeMobileMenu);
    return () => window.removeEventListener("keydown", closeMobileMenu);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = text.documentTitle;
  }, [language, text.documentTitle]);

  useEffect(() => {
    try {
      localStorage.setItem("series-finder-language", language);
    } catch (error) {
      console.error("Could not save language preference:", error);
    }
  }, [language]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#020617" : "#faf9ff");
    try {
      localStorage.setItem("series-finder-theme", theme);
    } catch (error) {
      console.error("Could not save theme preference:", error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistory));
    } catch (error) {
      console.error("Could not save search history:", error);
    }
  }, [searchHistory]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    setPredictions([]);
    setIsPredicting(false);
    if (!authenticatedUser || !isSearchFocused || trimmedQuery.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsPredicting(true);
      try {
        const params = new URLSearchParams({ q: trimmedQuery });
        const response = await localApiFetch(`/api/shows/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load search predictions");
        }
        if (!Array.isArray(data)) {
          throw new Error("Received invalid search prediction data");
        }
        setPredictions(data.map((result) => result.show).filter(Boolean).slice(0, 5));
      } catch (predictionError) {
        if (predictionError.name !== "AbortError") {
          console.error("Could not load search predictions:", predictionError);
          setPredictions([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsPredicting(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [authenticatedUser, isSearchFocused, query]);

  async function searchShows(event, suggestedQuery = query, genreFilter = "") {
    event?.preventDefault();
    const trimmedQuery = suggestedQuery.trim();
    if (!trimmedQuery) {
      setNotice(text.emptyQuery);
      setIsSearchFocused(false);
      setActivePrediction(-1);
      return;
    }
    if (!authenticatedUser) {
      if (!isCheckingSession) { setLoginOpen(false); setRegistrationStep(1); setRegistrationError(""); }
      setIsSearchFocused(false);
      return;
    }

    setNotice("");
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setActivePrediction(-1);
    setQuery(trimmedQuery);
    setSearchHistory((currentHistory) => [
      trimmedQuery,
      ...currentHistory.filter(
        (item) => item.toLocaleLowerCase() !== trimmedQuery.toLocaleLowerCase(),
      ),
    ].slice(0, maxSearchHistory));
    if (!searchedFor && status === "success" && !catalogSnapshotRef.current) {
      catalogSnapshotRef.current = {
        shows,
        catalogPage,
        hasMoreCatalog,
        selectedGenre,
        selectedPlatform,
      };
    }
    setSearchedFor(trimmedQuery);
    setStatus("loading");
    setError("");
    setSelectedGenre(genreFilter);
    setIsBrowsingGenre(Boolean(genreFilter));
    setSelectedPlatform("");
    setCatalogPage(0);
    setHasMoreCatalog(false);
    setShows([]);

    try {
      const params = new URLSearchParams({ q: trimmedQuery });
      const response = await localApiFetch(`/api/shows/search?${params.toString()}`);
      const data = await response.json();
      if (response.status === 401) { handleExpiredSession(true); return; }

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่");
      }

      if (!Array.isArray(data)) {
        throw new Error(text.invalidData);
      }

      setShows(data.map((result) => result.show));
      setStatus("success");
    } catch (searchError) {
      setError(searchError.message || text.searchError);
      setStatus("error");
    }
  }

  function returnToCatalog() {
    const snapshot = catalogSnapshotRef.current;
    if (!snapshot) return;
    setShows(snapshot.shows);
    setCatalogPage(snapshot.catalogPage);
    setHasMoreCatalog(snapshot.hasMoreCatalog);
    setSelectedGenre(snapshot.selectedGenre);
    setSelectedPlatform(snapshot.selectedPlatform);
    setIsBrowsingGenre(false);
    setSearchedFor("");
    setQuery("");
    setError("");
    setStatus("success");
    catalogSnapshotRef.current = null;
  }

  const matchingHistory = searchHistory
    .filter(
      (item) =>
        !query.trim() || item.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .slice(0, 5);
  const showPredictionList =
    isSearchFocused &&
    (matchingHistory.length > 0 || predictions.length > 0 || isPredicting);
  const availableGenres = [...new Set(shows.flatMap((show) => show.genres || []))].sort(
    (first, second) => first.localeCompare(second, language),
  );
  const availablePlatforms = [...new Set(shows.map(getPlatform).filter(Boolean))].sort(
    (first, second) => first.localeCompare(second, language),
  );
  const hasShowsWithoutGenres = shows.some((show) => !show.genres?.length);
  const genreOptions = [
    ...[...new Set([...popularGenres, ...availableGenres])].map((genre) => ({
      value: genre,
      label: genre,
    })),
    ...(status === "success" && hasShowsWithoutGenres
      ? [{ value: noGenreCategory, label: text.noGenre }]
      : []),
  ];
  const filteredShows = selectedGenre
    ? shows.filter((show) =>
        selectedGenre === noGenreCategory
          ? !show.genres?.length
          : show.genres?.includes(selectedGenre),
      )
    : shows;
  const platformFilteredShows = selectedPlatform
    ? filteredShows.filter((show) => getPlatform(show) === selectedPlatform)
    : filteredShows;

  function chooseGenre(genre) {
    setSelectedGenre(genre);
    setIsBrowsingGenre(false);
    setIsMobileMenuOpen(false);
  }

  function selectGenre(genre) {
    chooseGenre(genre);
  }

  function clearGenreSelection() {
    chooseGenre("");
  }

  async function loadMoreShows() {
    if (isLoadingMore || !hasMoreCatalog) return;
    const nextPage = catalogPage + 1;
    setIsLoadingMore(true);
    try {
      const response = authenticatedUser ? await localApiFetch(`/api/shows?page=${nextPage}`) : await fetch(`/api/shows/preview?page=${nextPage}`);
      const data = await response.json();
      if (response.status === 401) { handleExpiredSession(true); return; }
      if (!response.ok) {
        throw new Error(data.error || text.searchError);
      }
      if (!Array.isArray(data)) {
        throw new Error(text.invalidData);
      }
      setShows((currentShows) => [...currentShows, ...data]);
      setCatalogPage(nextPage);
      setHasMoreCatalog(data.length > 0);
    } catch (catalogError) {
      setError(catalogError.message || text.searchError);
      setStatus("error");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function selectSearchSuggestion(value) {
    searchInputRef.current?.blur();
    setIsSearchFocused(false);
    setActivePrediction(-1);
    searchShows(undefined, value);
  }

  return (
    <main className={`min-h-screen overflow-hidden bg-[#faf9ff] text-ink dark:bg-slate-950 dark:text-slate-100 ${theme}`}>
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-orb absolute -right-36 -top-44 h-[32rem] w-[32rem] rounded-full bg-purple-200/35 blur-3xl dark:hidden" />
        <div className="ambient-orb absolute -left-40 top-[34rem] h-80 w-80 rounded-full bg-fuchsia-100/60 blur-3xl dark:hidden" />
      </div>
      <header className="sticky top-0 z-40 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-3 border-b border-purple-100/70 bg-[#faf9ff]/95 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10 xl:px-16 dark:border-slate-800 dark:bg-slate-950/95 md:grid-cols-[1fr_minmax(18rem,36rem)_1fr]">
          <a href="#" className="flex items-center gap-2.5" aria-label={text.home}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-glow">
              <Clapperboard size={21} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink dark:text-slate-100">
              series<span className="text-purple-600">finder</span>
            </span>
          </a>
          <form
            onSubmit={searchShows}
            className={`${!loginOpen && registrationStep === null && isMobileSearchOpen ? "flex" : "hidden"} search-shell relative col-span-3 row-start-2 min-w-0 flex-wrap items-center gap-2 rounded-2xl border ${notice ? "border-rose-400 dark:border-rose-500" : "border-purple-100 dark:border-slate-700"} bg-white p-1.5 shadow-sm sm:rounded-full sm:pl-4 md:col-span-1 md:col-start-2 md:row-start-1 ${!loginOpen && registrationStep === null ? "md:flex" : "hidden"} dark:bg-slate-900`}
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
              <Search size={18} className="shrink-0 text-purple-500" />
              <span className="sr-only">{text.searchLabel}</span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setNotice("");
                  setActivePrediction(-1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={(event) => {
                  if (!predictionListRef.current?.contains(event.relatedTarget)) {
                    setIsSearchFocused(false);
                  }
                }}
                onKeyDown={(event) => {
                  const optionCount = matchingHistory.length + predictions.length;
                  if (event.key === "ArrowDown" && optionCount > 0) {
                    event.preventDefault();
                    setActivePrediction((current) => (current + 1) % optionCount);
                  } else if (event.key === "ArrowUp" && optionCount > 0) {
                    event.preventDefault();
                    setActivePrediction((current) => (current - 1 + optionCount) % optionCount);
                  } else if (event.key === "Escape") {
                    setIsSearchFocused(false);
                    setActivePrediction(-1);
                  } else if (event.key === "Enter" && activePrediction >= 0) {
                    event.preventDefault();
                    const selected =
                      activePrediction < matchingHistory.length
                        ? matchingHistory[activePrediction]
                        : predictions[activePrediction - matchingHistory.length]?.name;
                    if (selected) selectSearchSuggestion(selected);
                  }
                }}
                role="combobox"
                aria-autocomplete="list"
                aria-invalid={Boolean(notice)}
                aria-describedby={notice ? "search-validation" : undefined}
                aria-expanded={showPredictionList}
                aria-controls="search-predictions"
                aria-activedescendant={
                  activePrediction >= 0 ? `search-option-${activePrediction}` : undefined
                }
                placeholder={notice || text.searchPlaceholder}
                className={`w-full border-0 bg-transparent text-sm font-medium text-ink outline-none focus:ring-0 dark:text-slate-100 ${
                  notice
                    ? "placeholder:text-rose-600 dark:placeholder:text-rose-400"
                    : "placeholder:text-slate-400 dark:placeholder:text-slate-500"
                }`}
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              aria-label={status === "loading" ? text.searching : text.searchNow}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-3.5 text-sm font-bold text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-75 sm:rounded-full"
            >
              {status === "loading" ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              <span className="hidden sm:inline">{status === "loading" ? text.searching : text.search}</span>
            </button>
            {notice && (
              <p
                id="search-validation"
                role="alert"
                className="sr-only"
              >
                {notice}
              </p>
            )}
            {showPredictionList && (
              <div
                id="search-predictions"
                ref={predictionListRef}
                role="listbox"
                aria-label={`${text.searchHistory} and ${text.predictions}`}
                className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-purple-100 bg-white p-2 text-left shadow-[0_18px_45px_rgba(53,34,94,0.18)] dark:border-slate-700 dark:bg-slate-900"
              >
                {matchingHistory.length > 0 && (
                  <div className="pb-1">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                        <History size={14} /> {text.searchHistory}
                      </span>
                      {!query.trim() && (
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setSearchHistory([])}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-rose-500"
                        >
                          <Trash2 size={13} /> {text.clearHistory}
                        </button>
                      )}
                    </div>
                    {matchingHistory.map((item, index) => (
                      <button
                        id={`search-option-${index}`}
                        key={item}
                        type="button"
                        role="option"
                        aria-selected={activePrediction === index}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSearchSuggestion(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          activePrediction === index
                            ? "bg-purple-50 text-purple-800 dark:bg-slate-800 dark:text-purple-200"
                            : "text-slate-600 hover:bg-purple-50 hover:text-purple-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-purple-200"
                        }`}
                      >
                        <Clock3 size={15} className="shrink-0 text-purple-400" />
                        <span className="truncate">{item}</span>
                      </button>
                    ))}
                  </div>
                )}
                {(predictions.length > 0 || isPredicting) && (
                  <div className={matchingHistory.length > 0 ? "border-t border-slate-100 pt-1 dark:border-slate-800" : ""}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400">
                      <Sparkles size={14} /> {text.predictions}
                      {isPredicting && <LoaderCircle size={13} className="animate-spin" />}
                    </div>
                    {predictions.map((show, index) => {
                      const optionIndex = matchingHistory.length + index;
                      return (
                        <button
                          id={`search-option-${optionIndex}`}
                          key={show.id}
                          type="button"
                          role="option"
                          aria-selected={activePrediction === optionIndex}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSearchSuggestion(show.name)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            activePrediction === optionIndex
                              ? "bg-purple-50 text-purple-800 dark:bg-slate-800 dark:text-purple-200"
                              : "text-slate-600 hover:bg-purple-50 hover:text-purple-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-purple-200"
                          }`}
                        >
                          {show.image?.medium ? (
                            <img src={show.image.medium} alt="" className="h-9 w-8 shrink-0 rounded-md object-cover" />
                          ) : (
                            <Clapperboard size={18} className="mx-1.5 shrink-0 text-purple-400" />
                          )}
                          <span className="min-w-0 flex-1 truncate text-left font-semibold">{show.name}</span>
                          <span className="text-xs text-slate-400">{show.premiered?.slice(0, 4) || show.type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </form>
          <div className="col-start-3 row-start-1 flex items-center justify-end gap-2">
            {!loginOpen && registrationStep === null && <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen((open) => !open);
                setIsMobileMenuOpen(false);
              }}
              aria-label={text.searchLabel}
              aria-expanded={isMobileSearchOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-white text-purple-600 transition hover:border-purple-300 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-purple-300"
            >
              <Search size={18} />
            </button>}
            <button
              type="button"
              onClick={() => setLanguage((current) => current === "th" ? "en" : "th")}
              aria-label={text.toggleLanguage}
              title={text.toggleLanguage}
              className="hidden h-10 items-center gap-1.5 rounded-full border border-purple-100 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 md:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Languages size={16} className="text-purple-500" />
              {language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
              aria-label={text.toggleTheme}
              title={text.toggleTheme}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700 md:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            {!isCheckingSession && registrationStep === null && !loginOpen && !authenticatedUser && <button type="button" onClick={() => { setLoginOpen(true); setLoginError(""); }} className="rounded-full border border-purple-200 bg-white px-3 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-purple-300">{authText.login}</button>}
            {!isCheckingSession && registrationStep === null && !authenticatedUser && <button type="button" onClick={() => { setLoginOpen(false); setRegistrationStep(1); setRegistrationComplete(false); setRegistrationError(""); }} className="rounded-full bg-purple-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700 sm:px-4 sm:text-sm">{registrationText.join}</button>}
            {authenticatedUser && <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-500 lg:inline">{authenticatedUser.email}</span>}
            {authenticatedUser && <button type="button" onClick={logout} className="rounded-full border border-purple-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{language === "th" ? "ออกจากระบบ" : "Log out"}</button>}
            {authenticatedUser && <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(true);
                setIsMobileSearchOpen(false);
              }}
              aria-label={language === "th" ? "เปิดเมนู" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Menu size={19} />
            </button>}
          </div>
        </header>
        {accountNotice && registrationStep === null && !loginOpen && (
          <div role="status" className="mx-auto mt-4 max-w-7xl px-4 sm:px-7 lg:px-10">
            <p className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-200">
              {accountNotice}
            </p>
          </div>
        )}
        {registrationStep !== null && (
          <section className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-7 sm:py-14" aria-live="polite">
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 px-6 py-7 text-white sm:px-9">
                <div className="mb-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{registrationText.join}</div>
                <p className="text-sm font-semibold text-purple-100">{registrationText.join}</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{registrationComplete ? registrationText.success : registrationStep === 1 ? registrationText.title : registrationText.choose}</h1><p className="mt-2 text-sm text-purple-100">{registrationComplete ? registrationText.saved : registrationStep === 1 ? registrationText.subtitle : registrationText.chooseHint}</p>
              </div>
              {registrationComplete ? <div className="p-6 sm:p-9"><button type="button" onClick={() => setRegistrationStep(null)} className="rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700">{registrationText.return}</button></div> : registrationStep === 1 ? (
                <form onSubmit={continueRegistration} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-9">
                  <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">{registrationText.name}<input required value={registration.firstName} onChange={(e) => updateRegistration("firstName", e.target.value)} autoComplete="name" className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /></label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">{authText.username}<input required type="email" value={registration.email} onChange={(e) => updateRegistration("email", e.target.value)} autoComplete="email" className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /><span className="text-xs font-medium text-slate-500">{authText.usernameHint}</span></label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">{registrationText.password}<input required minLength={8} type="password" value={registration.password} onChange={(e) => updateRegistration("password", e.target.value)} autoComplete="new-password" className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /><span className="text-xs font-medium text-slate-500">{registrationText.passwordHint} {passwordEnglishLetterHint}</span></label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">{registrationText.confirmPassword}<input required minLength={8} type="password" value={registration.confirmPassword} onChange={(e) => updateRegistration("confirmPassword", e.target.value)} autoComplete="new-password" className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /></label>
                  {registrationError && <p role="alert" className="text-sm font-semibold text-rose-600 sm:col-span-2">{registrationError}</p>}
                  <div className="flex justify-end sm:col-span-2"><button type="submit" disabled={isRegistering} className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-glow hover:bg-purple-700 disabled:opacity-60">{isRegistering ? (language === "th" ? "กำลังสมัครสมาชิก..." : "Creating account...") : registrationText.finish}<ArrowUpRight size={17}/></button></div>
                </form>
              ) : <div className="p-6 sm:p-9"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{registrationGenres.map((genre) => { const selected = registration.genres.includes(genre); const genreIcons = { Action: "🎬", Adventure: "🧭", Anime: "✨", Comedy: "😄", Crime: "🕵️", Documentary: "🎥", Drama: "🎭", Family: "👨‍👩‍👧‍👦", Fantasy: "🪄", History: "🏛️", Horror: "👻", Mystery: "🔎", Romance: "💞", "Science-Fiction": "🚀", Thriller: "⚡" }; return <button key={genre} type="button" aria-pressed={selected} onClick={() => { setRegistration((current) => ({ ...current, genres: selected ? current.genres.filter((item) => item !== genre) : current.genres.length < 5 ? [...current.genres, genre] : current.genres })); setRegistrationError(""); }} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${selected ? "border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-100 dark:bg-purple-950 dark:text-purple-200" : "border-purple-100 bg-white text-slate-600 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}><span className="block text-lg">{genreIcons[genre]}</span><span className="mt-2 block">{genre}</span><span className="mt-1 block text-xs font-medium text-slate-400">{selected ? "✓ " : ""}{selected ? registrationText.selected : ""}</span></button>; })}</div><div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300"><span>{registrationText.selected} {registration.genres.length}/5</span><span className="h-2 w-28 overflow-hidden rounded-full bg-purple-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-purple-600 transition-all" style={{ width: `${registration.genres.length * 20}%` }} /></span></div>{registrationError && <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">{registrationError}</p>}<div className="mt-7 flex justify-between"><button type="button" onClick={() => setRegistrationStep(1)} className="rounded-full border border-purple-200 px-5 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50 dark:border-slate-700 dark:text-purple-300">{registrationText.back}</button><button type="button" onClick={finishRegistration} disabled={registration.genres.length !== 5} className="rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-glow hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40">{registrationText.finish}</button></div></div>}
            </div>
          </section>
        )}
        {loginOpen && !isCheckingSession && (
          <section className="relative z-10 mx-auto max-w-lg px-4 py-10 sm:px-7 sm:py-14">
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 px-6 py-8 text-white sm:px-9"><span className="text-sm font-semibold text-purple-100">Series Finder</span><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{authText.loginTitle}</h1><p className="mt-2 text-sm text-purple-100">{authText.loginHint}</p></div>
              <form onSubmit={submitLogin} className="grid gap-5 p-6 sm:p-9">
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">{authText.username}<input required type="email" autoComplete="email" value={login.email} onChange={(event) => { setLogin((current) => ({ ...current, email: event.target.value })); setLoginError(""); }} className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /></label>
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">{authText.passwordLabel}<input required type="password" autoComplete="current-password" value={login.password} onChange={(event) => { setLogin((current) => ({ ...current, password: event.target.value })); setLoginError(""); }} className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-medium outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950" /></label>
                {loginError && <p role="alert" className="text-sm font-semibold text-rose-600">{loginError}</p>}
                <button type="submit" disabled={isLoggingIn} className="rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-purple-700 disabled:opacity-60">{isLoggingIn ? (language === "th" ? "กำลังเข้าสู่ระบบ..." : "Signing in...") : authText.login}</button>
                <button type="button" onClick={() => setLoginOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300">{guestText.backHome}</button>
                <p className="text-center text-sm text-slate-500">{authText.noAccount} <button type="button" onClick={() => { setLoginOpen(false); setRegistrationStep(1); setRegistrationError(""); }} className="font-bold text-purple-700 hover:underline dark:text-purple-300">{authText.register}</button></p>
              </form>
            </div>
          </section>
        )}
        <nav
          hidden={registrationStep !== null || loginOpen || isCheckingSession || !authenticatedUser}
          aria-label={text.categories}
          className="relative z-20 hidden bg-[#faf9ff]/90 px-4 py-3 md:block sm:px-7 lg:px-10 xl:px-16 dark:bg-slate-950/90"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Clapperboard size={15} className="text-purple-500" />
              {text.categories}
              <select
                aria-label={text.categories}
                value={selectedGenre}
                onChange={(event) => selectGenre(event.target.value)}
                className="min-w-40 rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-purple-900"
              >
                <option value="">{text.allCategories}</option>
                {genreOptions.map((genre) => (
                  <option key={genre.value} value={genre.value}>{genre.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Tv size={15} className="text-purple-500" />
              {text.platforms}
              <select
                aria-label={text.platforms}
                value={selectedPlatform}
                onChange={(event) => setSelectedPlatform(event.target.value)}
                className="min-w-40 rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-purple-900"
              >
                <option value="">{text.allPlatforms}</option>
                {availablePlatforms.map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </label>
          </div>
        </nav>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label={language === "th" ? "ปิดเมนู" : "Close menu"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="mobile-drawer-backdrop absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-[2px]"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={language === "th" ? "เมนูการตั้งค่า" : "Settings menu"}
              className="mobile-drawer-panel absolute inset-y-0 left-0 flex w-[min(19rem,85vw)] flex-col border-r border-purple-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                <a
                  href="#"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                  aria-label={text.home}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-glow">
                    <Clapperboard size={21} />
                  </span>
                  <span className="text-lg font-extrabold tracking-tight text-ink dark:text-slate-100">
                    series<span className="text-purple-600">finder</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={language === "th" ? "ปิดเมนู" : "Close menu"}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <PanelLeftClose size={19} />
                </button>
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === "th" ? "การตั้งค่า" : "Preferences"}
              </p>
              <button
                type="button"
                onClick={() => setLanguage((current) => current === "th" ? "en" : "th")}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span className="inline-flex items-center gap-3">
                  <Languages size={18} className="text-purple-500" />
                  {language === "th" ? "ภาษา / Language" : "Language / ภาษา"}
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-slate-800 dark:text-purple-200">
                  {language.toUpperCase()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span className="inline-flex items-center gap-3">
                  {theme === "light" ? (
                    <Moon size={18} className="text-purple-500" />
                  ) : (
                    <Sun size={18} className="text-amber-400" />
                  )}
                  {language === "th" ? "ธีม" : "Theme"}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {theme === "light" ? (language === "th" ? "สว่าง" : "Light") : (language === "th" ? "มืด" : "Dark")}
                </span>
              </button>
              <div className="mt-6 min-h-0 flex-1 overflow-y-auto border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="mb-2 flex items-center gap-2">
                    <Clapperboard size={15} className="text-purple-500" />
                    {text.categories}
                  </span>
                  <select
                    aria-label={text.categories}
                    value={selectedGenre}
                    onChange={(event) => selectGenre(event.target.value)}
                    className="w-full rounded-xl border border-purple-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">{text.allCategories}</option>
                    {genreOptions.map((genre) => (
                      <option key={genre.value} value={genre.value}>{genre.label}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="mb-2 flex items-center gap-2">
                    <Tv size={15} className="text-purple-500" />
                    {text.platforms}
                  </span>
                  <select
                    aria-label={text.platforms}
                    value={selectedPlatform}
                    onChange={(event) => setSelectedPlatform(event.target.value)}
                    className="w-full rounded-xl border border-purple-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">{text.allPlatforms}</option>
                    {availablePlatforms.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
                {text.source} <span className="font-semibold text-purple-600">TVmaze</span>
              </div>
            </aside>
          </div>
        )}
        <div hidden={registrationStep !== null || loginOpen} className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 pb-16 sm:px-7 lg:px-10">

        <section aria-live="polite" aria-busy={status === "loading"}>
          {status === "idle" && authenticatedUser && (
            <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-dashed border-purple-200 bg-white/55 px-6 py-10 text-center sm:py-12 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Search size={25} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink dark:text-slate-100">{text.startTitle}</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{text.startHint}</p>
            </div>
          )}

          {status === "loading" && (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-64 flex-col items-center justify-center gap-3 py-12 text-purple-600 dark:text-purple-300"
            >
              <LoaderCircle size={40} strokeWidth={2.5} className="animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {text.loadingShows}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mx-auto max-w-xl rounded-[1.75rem] border border-rose-100 bg-white px-6 py-10 text-center shadow-card dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <X size={24} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink dark:text-slate-100">{text.errorTitle}</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <button
                type="button"
                onClick={(event) => searchShows(event, searchedFor)}
                className="mt-5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700"
              >
                {text.retry}
              </button>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  {searchedFor && (
                    <button
                      type="button"
                      onClick={returnToCatalog}
                      className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-purple-300"
                    >
                      <ArrowLeft size={16} />
                      {text.backToCatalog}
                    </button>
                  )}
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
                    {text.results}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl dark:text-slate-100">
                    {!searchedFor
                      ? text.catalogTitle
                      : shows.length
                      ? isBrowsingGenre
                        ? text.categoryResults(selectedGenre)
                        : text.matching(searchedFor)
                      : text.notFound(searchedFor)}
                  </h2>
                  {(selectedGenre || selectedPlatform) && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {text.filteredCount(
                        platformFilteredShows.length,
                        [
                          selectedGenre && (selectedGenre === noGenreCategory ? text.noGenre : selectedGenre),
                          selectedPlatform,
                        ].filter(Boolean).join(" · "),
                      )}
                    </p>
                  )}
                </div>
                {shows.length > 0 && (
                  <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700">
                    {text.count(platformFilteredShows.length)}
                  </span>
                )}
              </div>

              {platformFilteredShows.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {platformFilteredShows.map((show) => (
                    <ShowCard
                      key={`${show.id}-${show.name}`}
                      show={show}
                      onSelect={(show) => {
                        setSelectedShow(show);
                      }}
                      language={language}
                      text={text}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-purple-100 bg-white/75 px-6 py-10 text-center shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                    <Clapperboard size={25} />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    {shows.length > 0 ? text.noCatalogResults : text.noResultsHint}
                  </p>
                  {shows.length > 0 && (selectedGenre || selectedPlatform) && (
                    <button
                      type="button"
                      onClick={() => {
                        chooseGenre("");
                        setSelectedPlatform("");
                      }}
                      className="mt-4 rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-purple-700"
                    >
                      {text.allCategories}
                    </button>
                  )}
                </div>
              )}
              {hasMoreCatalog && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreShows}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isLoadingMore && <LoaderCircle size={17} className="animate-spin" />}
                    {isLoadingMore ? text.loadingMore : text.loadMore}
                  </button>
                </div>
              )}
              {!searchedFor && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  {text.loadedCount(shows.length)}
                </p>
              )}
            </>
          )}
        </section>

        <footer className="mt-14 border-t border-purple-100/80 pt-5 text-center text-xs text-slate-400 dark:border-slate-800">
          {text.source} <span className="font-semibold text-purple-600">TVmaze API</span>
        </footer>
      </div>

      {selectedShow && (
        <ShowDialog
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          language={language}
          text={text}
          isMember={Boolean(authenticatedUser)}
        />
      )}
    </main>
  );
}

export default App;
