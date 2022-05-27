/// <reference types="cypress" />

import data from "../../public/data1.json";

describe("header-component", () => {
  beforeEach(() => {
    cy.visit("localhost:3000");
  });

  it("shows header component", () => {
    cy.get("#header-bar").children().should("have.length", 1);
    cy.get("#header-bar")
      .children()
      .first()
      .should("have.class", "flex")
      .and("have.class", "flex-row")
      .and("have.class", "justify-between");

    cy.get("#header-title").should(
      "have.text",
      `${data.root.display_name} (${data.root.version})`
    );

    cy.get("#search-box").should("exist");
  });
});
