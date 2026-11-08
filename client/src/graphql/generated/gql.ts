/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation SignIn($email: String!, $password: String!) {\n    signIn(email: $email, password: $password) {\n      token\n      viewer {\n        id\n        name\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.SignInDocument,
    "\n  query Viewer {\n    viewer {\n      id\n      name\n      email\n      memberships {\n        id\n        role\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.ViewerDocument,
    "\n  query EquipmentList($search: String, $category: String, $after: String) {\n    equipment(search: $search, category: $category, first: 12, after: $after) {\n      nodes {\n        id\n        name\n        category\n        location\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n    equipmentCategories\n  }\n": typeof types.EquipmentListDocument,
    "\n  query EquipmentDetail($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) {\n    equipmentItem(id: $id) {\n      id\n      name\n      category\n      location\n      description\n      active\n      reservations(from: $from, to: $to) {\n        id\n        startsAt\n        endsAt\n        note\n        isMine\n        member {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.EquipmentDetailDocument,
    "\n  mutation CreateReservation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {\n    createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {\n      reservation {\n        id\n        startsAt\n        endsAt\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.CreateReservationDocument,
    "\n  query MyReservations($includePast: Boolean!) {\n    myReservations(includePast: $includePast, first: 50) {\n      nodes {\n        id\n        startsAt\n        endsAt\n        note\n        status\n        canCancel\n        equipment {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.MyReservationsDocument,
    "\n  mutation CancelReservation($id: ID!) {\n    cancelReservation(id: $id) {\n      reservation {\n        id\n        status\n        canCancel\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.CancelReservationDocument,
    "\n  mutation RetireEquipment($id: ID!) {\n    retireEquipment(id: $id) {\n      equipment {\n        id\n        active\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.RetireEquipmentDocument,
    "\n  query AuditEvents($after: String) {\n    auditEvents(first: 25, after: $after) {\n      nodes {\n        id\n        action\n        subjectType\n        subjectId\n        metadata\n        createdAt\n        actor {\n          id\n          name\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AuditEventsDocument,
};
const documents: Documents = {
    "\n  mutation SignIn($email: String!, $password: String!) {\n    signIn(email: $email, password: $password) {\n      token\n      viewer {\n        id\n        name\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.SignInDocument,
    "\n  query Viewer {\n    viewer {\n      id\n      name\n      email\n      memberships {\n        id\n        role\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.ViewerDocument,
    "\n  query EquipmentList($search: String, $category: String, $after: String) {\n    equipment(search: $search, category: $category, first: 12, after: $after) {\n      nodes {\n        id\n        name\n        category\n        location\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n    equipmentCategories\n  }\n": types.EquipmentListDocument,
    "\n  query EquipmentDetail($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) {\n    equipmentItem(id: $id) {\n      id\n      name\n      category\n      location\n      description\n      active\n      reservations(from: $from, to: $to) {\n        id\n        startsAt\n        endsAt\n        note\n        isMine\n        member {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.EquipmentDetailDocument,
    "\n  mutation CreateReservation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {\n    createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {\n      reservation {\n        id\n        startsAt\n        endsAt\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.CreateReservationDocument,
    "\n  query MyReservations($includePast: Boolean!) {\n    myReservations(includePast: $includePast, first: 50) {\n      nodes {\n        id\n        startsAt\n        endsAt\n        note\n        status\n        canCancel\n        equipment {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.MyReservationsDocument,
    "\n  mutation CancelReservation($id: ID!) {\n    cancelReservation(id: $id) {\n      reservation {\n        id\n        status\n        canCancel\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.CancelReservationDocument,
    "\n  mutation RetireEquipment($id: ID!) {\n    retireEquipment(id: $id) {\n      equipment {\n        id\n        active\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.RetireEquipmentDocument,
    "\n  query AuditEvents($after: String) {\n    auditEvents(first: 25, after: $after) {\n      nodes {\n        id\n        action\n        subjectType\n        subjectId\n        metadata\n        createdAt\n        actor {\n          id\n          name\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AuditEventsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignIn($email: String!, $password: String!) {\n    signIn(email: $email, password: $password) {\n      token\n      viewer {\n        id\n        name\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SignIn($email: String!, $password: String!) {\n    signIn(email: $email, password: $password) {\n      token\n      viewer {\n        id\n        name\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Viewer {\n    viewer {\n      id\n      name\n      email\n      memberships {\n        id\n        role\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Viewer {\n    viewer {\n      id\n      name\n      email\n      memberships {\n        id\n        role\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EquipmentList($search: String, $category: String, $after: String) {\n    equipment(search: $search, category: $category, first: 12, after: $after) {\n      nodes {\n        id\n        name\n        category\n        location\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n    equipmentCategories\n  }\n"): (typeof documents)["\n  query EquipmentList($search: String, $category: String, $after: String) {\n    equipment(search: $search, category: $category, first: 12, after: $after) {\n      nodes {\n        id\n        name\n        category\n        location\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n    equipmentCategories\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EquipmentDetail($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) {\n    equipmentItem(id: $id) {\n      id\n      name\n      category\n      location\n      description\n      active\n      reservations(from: $from, to: $to) {\n        id\n        startsAt\n        endsAt\n        note\n        isMine\n        member {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query EquipmentDetail($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) {\n    equipmentItem(id: $id) {\n      id\n      name\n      category\n      location\n      description\n      active\n      reservations(from: $from, to: $to) {\n        id\n        startsAt\n        endsAt\n        note\n        isMine\n        member {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateReservation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {\n    createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {\n      reservation {\n        id\n        startsAt\n        endsAt\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateReservation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {\n    createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {\n      reservation {\n        id\n        startsAt\n        endsAt\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyReservations($includePast: Boolean!) {\n    myReservations(includePast: $includePast, first: 50) {\n      nodes {\n        id\n        startsAt\n        endsAt\n        note\n        status\n        canCancel\n        equipment {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyReservations($includePast: Boolean!) {\n    myReservations(includePast: $includePast, first: 50) {\n      nodes {\n        id\n        startsAt\n        endsAt\n        note\n        status\n        canCancel\n        equipment {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelReservation($id: ID!) {\n    cancelReservation(id: $id) {\n      reservation {\n        id\n        status\n        canCancel\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CancelReservation($id: ID!) {\n    cancelReservation(id: $id) {\n      reservation {\n        id\n        status\n        canCancel\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RetireEquipment($id: ID!) {\n    retireEquipment(id: $id) {\n      equipment {\n        id\n        active\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RetireEquipment($id: ID!) {\n    retireEquipment(id: $id) {\n      equipment {\n        id\n        active\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuditEvents($after: String) {\n    auditEvents(first: 25, after: $after) {\n      nodes {\n        id\n        action\n        subjectType\n        subjectId\n        metadata\n        createdAt\n        actor {\n          id\n          name\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query AuditEvents($after: String) {\n    auditEvents(first: 25, after: $after) {\n      nodes {\n        id\n        action\n        subjectType\n        subjectId\n        metadata\n        createdAt\n        actor {\n          id\n          name\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;