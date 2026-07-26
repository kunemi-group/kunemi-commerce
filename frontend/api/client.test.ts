import { describe, expect, it } from "vitest"
import { getApiErrorMessage } from "./client"
import axios from "axios"

describe("getApiErrorMessage", () => {
  it("reads string message from axios error body", () => {
    const err = {
      isAxiosError: true,
      response: { data: { message: "Order not found" }, status: 404 },
      message: "Request failed",
    }
    // axios.isAxiosError needs a real AxiosError shape — use AxiosError constructor
    const ax = new axios.AxiosError("fail")
    ax.response = {
      data: { message: "Order not found" },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: {} as never,
    }
    expect(getApiErrorMessage(ax)).toBe("Order not found")
  })

  it("joins array validation messages", () => {
    const ax = new axios.AxiosError("fail")
    ax.response = {
      data: { message: ["a required", "b required"] },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    }
    expect(getApiErrorMessage(ax)).toBe("a required, b required")
  })

  it("falls back for plain Error", () => {
    expect(getApiErrorMessage(new Error("boom"))).toBe("boom")
  })
})
