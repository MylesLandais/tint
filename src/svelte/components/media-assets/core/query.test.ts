import { describe, expect, it } from "vitest"
import { hasToken, negateToken, parseQuery, removeToken, toggleToken } from "./query"

describe("query tokens", () => {
  it("parses keys, values and negation", () => {
    expect(parseQuery("person:maya -type:video cafe")).toEqual([
      { raw: "person:maya", negated: false, key: "person", value: "maya" },
      { raw: "-type:video", negated: true, key: "type", value: "video" },
      { raw: "cafe", negated: false, key: null, value: "cafe" },
    ])
  })
  it("toggles a token on and off, replacing its negation", () => {
    expect(toggleToken("cafe", "type:video")).toBe("cafe type:video")
    expect(toggleToken("cafe type:video", "type:video")).toBe("cafe")
    expect(toggleToken("-cafe", "cafe")).toBe("cafe")
    expect(hasToken("a b", "b")).toBe(true)
  })
  it("removes and negates by index", () => {
    expect(removeToken("a b c", 1)).toBe("a c")
    expect(negateToken("a b", 0)).toBe("-a b")
    expect(negateToken("-a b", 0)).toBe("a b")
  })
})
