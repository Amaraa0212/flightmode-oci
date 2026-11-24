import { createContext, useContext, useState, type ReactNode } from 'react'

const mn = {
  appName: 'SKYTHIUM',
  language: 'EN',
  startAgain: 'Дахин эхлэх',
  back: 'Буцах',
  continue: 'Үргэлжлүүлэх',
  loading: 'Ачаалж байна…',
  retry: 'Дахин оролдох',

  otTitle: 'Оюу Толгой — онлайн бүртгэл',
  otSubtitle: 'SAP дугаараа оруулж нислэгээ бүртгүүлнэ үү.',
  sapNumber: 'SAP дугаар',
  sapPlaceholder: 'Жишээ: 12345678',
  search: 'Хайх',

  pnrTitle: 'Онлайн бүртгэл',
  pnrSubtitle: 'Захиалгын дугаар (PNR) болон овгоо латинаар оруулна уу.',
  pnr: 'Захиалгын дугаар (PNR)',
  pnrPlaceholder: 'Жишээ: AB12CD',
  lastName: 'Овог',
  lastNamePlaceholder: 'Жишээ: DORJ',

  verifyTitle: 'Баталгаажуулах код',
  verifySubtitle: (emails: string) =>
    `4 оронтой кодыг ${emails} хаяг руу илгээлээ.`,
  code: 'Код',
  verify: 'Баталгаажуулах',
  resend: 'Код дахин илгээх',
  resent: 'Код дахин илгээлээ.',

  flightsTitle: 'Таны нислэгүүд',
  flightsSubtitle: 'Онлайн бүртгэл нээлттэй нислэгээ сонгоно уу.',
  checkIn: 'Бүртгүүлэх',
  boardingPasses: 'Суудлын тасалбар',
  checkedIn: 'Бүртгэгдсэн',
  notCheckedIn: 'Бүртгэгдээгүй',
  departure: 'Хөөрөх',

  passengersTitle: 'Зорчигч сонгох',
  infantWith: 'Нярай',
  chooseSeat: 'Суудал сонгох',
  seatFor: (name: string) => `${name} — суудал`,
  autoSeat: 'Суудал сонгоогүй бол автоматаар өгнө.',
  seat: 'Суудал',
  noPassengerSelected: 'Бүртгүүлэх зорчигчоо сонгоно уу.',

  seatAvailable: 'Сул',
  seatTaken: 'Эзэлсэн',
  seatSelected: 'Сонгосон',
  seatClosed: 'Онлайнаар сонгох боломжгүй',
  exitRow: 'Яаралтай гарц',
  front: 'Урд',

  policiesTitle: 'Ачаа тээшний дүрэм',
  acceptPolicies:
    'Би ачаа тээш болон аюултай ачааны дүрэмтэй танилцаж, зөвшөөрч байна.',
  confirmCheckIn: 'Бүртгэлийг баталгаажуулах',
  checkedInOk: 'Амжилттай бүртгэгдлээ.',

  passTitle: 'Суудлын тасалбар',
  passSubtitle: 'Онгоцонд суухдаа QR кодыг үзүүлнэ үү.',
  print: 'Хэвлэх / PDF',
  passenger: 'Зорчигч',
  flight: 'Нислэг',
  date: 'Огноо',
  boarding: 'Онгоцонд суух',
  gate: 'Гарц',
  from: 'Хаанаас',
  to: 'Хаашаа',
  backToFlights: 'Нислэгүүд рүү буцах',
  noPasses: 'Бүртгэгдсэн зорчигч алга.',
  navCheckin: 'Бүртгэл',
  navFlights: 'Нислэгүүд',
  pillOt: 'Чартер · Оюу Толгой',
  pillPublic: 'Онлайн бүртгэл',
  pillWindow: 'Онлайн бүртгэлийн цонх: нээлттэй',
  pillDone: 'Бүртгэл амжилттай',
  sapHint: 'Ажилтан эсвэл гэрээт ажилтны SAP дугаарыг алдаагүй оруулна уу.',
  pnrHint: 'Захиалгын баталгаажуулалт дээрх 6 тэмдэгттэй дугаар.',
  paste: 'Буулгах',
  directFlight: 'Шууд нислэг',
  aircraft: 'Онгоц',
  cabin: 'Ангилал',
  cabins: {
    Y: 'Энгийн (Y)',
    W: 'Premium (W)',
    C: 'Бизнес (C)',
    F: 'Нэгдүгээр (F)',
  } as Record<string, string>,
  notesTitle: 'Анхаарах санамж',
  noteSeat: 'Суудлаа сонгож, суудлын тасалбараа утсандаа хадгална.',
  noteClose: (at: string) => `Онлайн бүртгэл ${at}-д хаагдана.`,
  seatTypes: {
    window: 'Цонх тал',
    aisle: 'Гарцын тал',
    middle: 'Дунд суудал',
  } as Record<string, string>,
  exitRows: 'Ослын гарцын эгнээ — онлайнаар сонгох боломжгүй',
  passengerN: (n: number) => `Зорчигч ${String(n).padStart(2, '0')}`,
  boardingTime: 'Суух цаг',
  terminal: 'Терминал',
  sequence: 'Дараалал',
  seatSelectTitle: 'Суудал сонгох',
  viewPass: 'Суудлын тасалбар харах',

  notOpenYet: (flight: string, at: string) =>
    `${flight} нислэгийн онлайн бүртгэл ${at}-д нээгдэнэ.`,
  errors: {
    no_online_checkin: 'Онлайн бүртгэл нээлттэй нислэг олдсонгүй.',
    booking_not_found: 'Захиалгын дугаар эсвэл овог буруу байна.',
    no_contact_email:
      'Захиалгад и-мэйл хаяг бүртгэгдээгүй тул онлайнаар баталгаажуулах боломжгүй. Нисэх буудлын бүртгэлийн лангуунд хандана уу.',
    invalid_code: 'Код буруу эсвэл хугацаа нь дууссан байна.',
    lookup_expired: 'Хайлтын хугацаа дууссан. Дахин хайна уу.',
    session_expired: 'Бүртгэлийн хугацаа дууссан. Дахин эхэлнэ үү.',
    online_checkin_closed: 'Энэ нислэгийн онлайн бүртгэл хаагдсан байна.',
    seat_not_available: 'Энэ суудлыг онлайнаар сонгох боломжгүй.',
    seat_held: 'Энэ суудлыг өөр хүн сонгож байна.',
    too_many: 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.',
    network: 'Сервертэй холбогдож чадсангүй.',
    unknown: 'Алдаа гарлаа.',
  } as Record<string, string>,
}

type Dict = typeof mn

const en: Dict = {
  appName: 'SKYTHIUM',
  language: 'MN',
  startAgain: 'Start again',
  back: 'Back',
  continue: 'Continue',
  loading: 'Loading…',
  retry: 'Try again',

  otTitle: 'Oyu Tolgoi — online check-in',
  otSubtitle: 'Enter your SAP number to check in for your flight.',
  sapNumber: 'SAP number',
  sapPlaceholder: 'e.g. 12345678',
  search: 'Search',

  pnrTitle: 'Online check-in',
  pnrSubtitle: 'Enter your booking reference (PNR) and last name.',
  pnr: 'Booking reference (PNR)',
  pnrPlaceholder: 'e.g. AB12CD',
  lastName: 'Last name',
  lastNamePlaceholder: 'e.g. DORJ',

  verifyTitle: 'Verification code',
  verifySubtitle: (emails: string) => `We sent a 4-digit code to ${emails}.`,
  code: 'Code',
  verify: 'Verify',
  resend: 'Resend code',
  resent: 'Code sent again.',

  flightsTitle: 'Your flights',
  flightsSubtitle: 'Choose a flight that is open for online check-in.',
  checkIn: 'Check in',
  boardingPasses: 'Boarding passes',
  checkedIn: 'Checked in',
  notCheckedIn: 'Not checked in',
  departure: 'Departure',

  passengersTitle: 'Choose passengers',
  infantWith: 'Infant',
  chooseSeat: 'Choose seat',
  seatFor: (name: string) => `${name} — seat`,
  autoSeat: 'If you do not choose, a seat is given automatically.',
  seat: 'Seat',
  noPassengerSelected: 'Choose who to check in.',

  seatAvailable: 'Free',
  seatTaken: 'Taken',
  seatSelected: 'Selected',
  seatClosed: 'Not available online',
  exitRow: 'Emergency exit',
  front: 'Front',

  policiesTitle: 'Baggage rules',
  acceptPolicies:
    'I have read and accept the baggage and dangerous goods rules.',
  confirmCheckIn: 'Confirm check-in',
  checkedInOk: 'You are checked in.',

  passTitle: 'Boarding pass',
  passSubtitle: 'Show the QR code when boarding.',
  print: 'Print / PDF',
  passenger: 'Passenger',
  flight: 'Flight',
  date: 'Date',
  boarding: 'Boarding',
  gate: 'Gate',
  from: 'From',
  to: 'To',
  backToFlights: 'Back to flights',
  noPasses: 'No passenger is checked in yet.',
  navCheckin: 'Check-in',
  navFlights: 'Flights',
  pillOt: 'Charter · Oyu Tolgoi',
  pillPublic: 'Online check-in',
  pillWindow: 'Online check-in window: open',
  pillDone: 'Checked in',
  sapHint: 'Enter the SAP number of the employee or contractor exactly.',
  pnrHint: 'The 6-character code on your booking confirmation.',
  paste: 'Paste',
  directFlight: 'Direct flight',
  aircraft: 'Aircraft',
  cabin: 'Class',
  cabins: {
    Y: 'Economy (Y)',
    W: 'Premium (W)',
    C: 'Business (C)',
    F: 'First (F)',
  },
  notesTitle: 'Good to know',
  noteSeat: 'Choose your seat and keep the boarding pass on your phone.',
  noteClose: (at: string) => `Online check-in closes at ${at}.`,
  seatTypes: { window: 'Window', aisle: 'Aisle', middle: 'Middle' },
  exitRows: 'Emergency exit rows — not available online',
  passengerN: (n: number) => `Passenger ${String(n).padStart(2, '0')}`,
  boardingTime: 'Boarding',
  terminal: 'Terminal',
  sequence: 'Seq',
  seatSelectTitle: 'Seat selection',
  viewPass: 'View boarding pass',

  notOpenYet: (flight: string, at: string) =>
    `Online check-in for ${flight} opens at ${at}.`,
  errors: {
    no_online_checkin: 'No flight is open for online check-in.',
    booking_not_found: 'The booking reference or last name is wrong.',
    no_contact_email:
      'This booking has no e-mail address for the code. Please check in at the airport counter.',
    invalid_code: 'The code is wrong or expired.',
    lookup_expired: 'Your search expired. Please search again.',
    session_expired: 'Your check-in session expired. Please start again.',
    online_checkin_closed: 'Online check-in is closed for this flight.',
    seat_not_available: 'This seat cannot be chosen online.',
    seat_held: 'Someone else is choosing this seat right now.',
    too_many: 'Too many attempts. Please wait a moment and try again.',
    network: 'Could not reach the server.',
    unknown: 'Something went wrong.',
  },
}

export type Locale = 'mn' | 'en'

function initialLocale(): Locale {
  try {
    return localStorage.getItem('oci-locale') === 'en' ? 'en' : 'mn'
  } catch {
    return 'mn'
  }
}

const I18nContext = createContext<{
  t: Dict
  locale: Locale
  toggle: () => void
}>({
  t: mn,
  locale: 'mn',
  toggle: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const toggle = () => {
    const next = locale === 'mn' ? 'en' : 'mn'
    setLocale(next)
    try {
      localStorage.setItem('oci-locale', next)
    } catch {
      // not saved; the toggle still works for this visit
    }
  }

  return (
    <I18nContext.Provider
      value={{ t: locale === 'mn' ? mn : en, locale, toggle }}
    >
      {children}
    </I18nContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => useContext(I18nContext)
