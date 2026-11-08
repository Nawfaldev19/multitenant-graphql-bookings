import { graphql } from "./generated";

export const SIGN_IN = graphql(`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      viewer {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`);

export const VIEWER = graphql(`
  query Viewer {
    viewer {
      id
      name
      email
      memberships {
        id
        role
        organization {
          id
          name
        }
      }
    }
  }
`);

export const EQUIPMENT_LIST = graphql(`
  query EquipmentList($search: String, $category: String, $after: String) {
    equipment(search: $search, category: $category, first: 12, after: $after) {
      nodes {
        id
        name
        category
        location
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    equipmentCategories
  }
`);

export const EQUIPMENT_DETAIL = graphql(`
  query EquipmentDetail($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) {
    equipmentItem(id: $id) {
      id
      name
      category
      location
      description
      active
      reservations(from: $from, to: $to) {
        id
        startsAt
        endsAt
        note
        isMine
        member {
          id
          name
        }
      }
    }
  }
`);

export const CREATE_RESERVATION = graphql(`
  mutation CreateReservation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {
    createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {
      reservation {
        id
        startsAt
        endsAt
      }
      errors {
        field
        message
      }
    }
  }
`);

export const MY_RESERVATIONS = graphql(`
  query MyReservations($includePast: Boolean!) {
    myReservations(includePast: $includePast, first: 50) {
      nodes {
        id
        startsAt
        endsAt
        note
        status
        canCancel
        equipment {
          id
          name
        }
      }
    }
  }
`);

export const CANCEL_RESERVATION = graphql(`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      reservation {
        id
        status
        canCancel
      }
      errors {
        field
        message
      }
    }
  }
`);

export const RETIRE_EQUIPMENT = graphql(`
  mutation RetireEquipment($id: ID!) {
    retireEquipment(id: $id) {
      equipment {
        id
        active
      }
      errors {
        field
        message
      }
    }
  }
`);

export const AUDIT_EVENTS = graphql(`
  query AuditEvents($after: String) {
    auditEvents(first: 25, after: $after) {
      nodes {
        id
        action
        subjectType
        subjectId
        metadata
        createdAt
        actor {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
