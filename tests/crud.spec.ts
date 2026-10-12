import { test, expect } from "@playwright/test";

test("word CRUD API works", async ({ request }) => {
  const createResponse = await request.post("/api/words", {
    data: {
      text: "playwright-test",
      phonemes: ["p", "l", "eɪ"],
      hint: "Created by Playwright",
    },
  });

  expect(createResponse.ok()).toBeTruthy();

  const created = await createResponse.json();
  expect(created.text).toBe("playwright-test");

  const id = created.id;

  const getResponse = await request.get(`/api/words/${id}`);
  expect(getResponse.ok()).toBeTruthy();

  const fetched = await getResponse.json();
  expect(fetched.text).toBe("playwright-test");

  const updateResponse = await request.put(`/api/words/${id}`, {
    data: {
      text: "playwright-updated",
      phonemes: ["p", "l", "eɪ"],
      hint: "Updated by Playwright",
    },
  });

  expect(updateResponse.ok()).toBeTruthy();

  const updated = await updateResponse.json();
  expect(updated.text).toBe("playwright-updated");

  const deleteResponse = await request.delete(`/api/words/${id}`);
  expect(deleteResponse.ok()).toBeTruthy();

  const finalResponse = await request.get(`/api/words/${id}`);
  expect(finalResponse.status()).toBe(404);
});