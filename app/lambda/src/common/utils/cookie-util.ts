export class CookieUtil {
  public static getValue(cookie: string, key: string) {
    const cookieArray = cookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      const cookie = cookieArray[i].trim();
      const cookies = cookie.split('=');
      if (cookies[0] == key) {
        return cookie.slice(cookies[0].length + 1);
      }
    }
    return '';
  }
}
