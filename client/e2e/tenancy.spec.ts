import { expect, test } from "@playwright/test";
import { API_URL, DEMO_PASSWORD, signInAs } from "./helpers";

test("switching spaces swaps all data and role-based navigation", async ({ page }) => {
  await signInAs(page, "Ada Okafor");
  await expect(page.getByRole("link", { name: /Laser cutter/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Audit log" })).toBeVisible();

  await page.getByLabel("Space").selectOption({ label: "Foundry Lane Workshop (member)" });

  await expect(page.getByRole("link", { name: /Pottery kiln/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Laser cutter/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit log" })).toHaveCount(0);
});

test("the API refuses cross-space access even with forged ids and headers", async ({ request }) => {
  const graphql = async (query: string, variables: object, headers: Record<string, string> = {}) => {
    const response = await request.post(API_URL, { data: { query, variables }, headers });
    expect(response.ok()).toBeTruthy();
    return (await response.json()) as {
      data: Record<string, unknown> | null;
      errors?: { extensions?: { code?: string } }[];
    };
  };

  const signIn = await graphql(
    "mutation($e: String!, $p: String!) { signIn(email: $e, password: $p) { token viewer { memberships { organization { id name } } } } }",
    {
      e: "theo@example.com",
      p: DEMO_PASSWORD,
    },
  );
  const payload = signIn.data?.signIn as { token: string; viewer: { memberships: { organization: { id: string } }[] } };
  const theoSpace = payload.viewer.memberships[0]?.organization.id ?? "";
  const auth = { Authorization: `Bearer ${payload.token}` };

  const ada = await graphql("mutation($e: String!, $p: String!) { signIn(email: $e, password: $p) { token } }", {
    e: "ada@example.com",
    p: DEMO_PASSWORD,
  });
  const adaToken = (ada.data?.signIn as { token: string }).token;
  const adaSpaces = await graphql(
    "{ viewer { memberships { role organization { id name } } } }",
    {},
    { Authorization: `Bearer ${adaToken}` },
  );
  const riverside = (
    adaSpaces.data?.viewer as { memberships: { organization: { id: string; name: string } }[] }
  ).memberships.find((membership) => membership.organization.name === "Riverside Makers");
  const riversideId = riverside?.organization.id ?? "";
  const riversideItems = await graphql(
    "{ equipment(first: 1) { nodes { id } } }",
    {},
    { Authorization: `Bearer ${adaToken}`, "X-Organization-Id": riversideId },
  );
  const riversideItemId = (riversideItems.data?.equipment as { nodes: { id: string }[] }).nodes[0]?.id ?? "";

  const forgedHeader = await graphql(
    "{ equipment { nodes { id } } }",
    {},
    { ...auth, "X-Organization-Id": riversideId },
  );
  expect(forgedHeader.errors?.[0]?.extensions?.code).toBe("TENANT_REQUIRED");

  const guessedId = await graphql(
    "query($id: ID!) { equipmentItem(id: $id) { name } }",
    { id: riversideItemId },
    { ...auth, "X-Organization-Id": theoSpace },
  );
  expect(guessedId.errors?.[0]?.extensions?.code).toBe("NOT_FOUND");
  expect(guessedId.data).toBeNull();
});
