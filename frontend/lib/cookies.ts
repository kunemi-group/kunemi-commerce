/**
 * Cookie Utilities for Next.js Security Best Practices
 * Ref: https://nextjs.org/docs/app/guides/authentication#3-setting-cookies-recommended-options
 */

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const nameEQ = `${name}=`
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim()
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
  }
  return null
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return
  let expires = ""
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = `; expires=${date.toUTCString()}`
  }
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:"
  const secureFlag = isSecure ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(
    value || "",
  )}${expires}; path=/; SameSite=Lax${secureFlag}`
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`
}
