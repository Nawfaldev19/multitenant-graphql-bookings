import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { NetworkStatus, useQuery } from "@apollo/client";
import { MapPin } from "lucide-react";
import { EQUIPMENT_LIST } from "../graphql/operations";
import { EmptyState, ErrorState, LoadingCards } from "../components/States";
import { useWorkspace } from "../components/workspace";
import { useDebouncedValue } from "../lib/useDebouncedValue";

export function EquipmentListPage() {
  const { membership } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const search = useDebouncedValue(searchInput.trim(), 250);

  useEffect(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (search) next.set("q", search);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [search, setParams]);

  const { data, error, networkStatus, refetch, fetchMore } = useQuery(EQUIPMENT_LIST, {
    variables: { search: search || null, category: category || null },
    notifyOnNetworkStatusChange: true,
  });

  const setCategory = (value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set("category", value);
      else next.delete("category");
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setParams(new URLSearchParams());
  };

  const page = data?.equipment;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Equipment</h1>
          <p>Everything you can book at {membership.organization.name}.</p>
        </div>
      </div>

      <div className="toolbar" role="search">
        <div className="field">
          <label htmlFor="equipment-search">Search</label>
          <input
            id="equipment-search"
            className="input"
            type="search"
            placeholder="Name or description"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="equipment-category">Category</label>
          <select
            id="equipment-category"
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {data?.equipmentCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !page ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !page ? (
        <LoadingCards label="Loading equipment" />
      ) : page.nodes.length === 0 ? (
        <EmptyState
          title="No equipment matches"
          action={
            <button type="button" className="button button-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        >
          Try a different search or category.
        </EmptyState>
      ) : (
        <>
          <p className="visually-hidden" role="status">
            {page.nodes.length} items shown
          </p>
          <ul className="grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {page.nodes.map((item) => (
              <li key={item.id}>
                <Link className="card equipment-card" to={`/app/equipment/${item.id}`}>
                  <span className="badge">{item.category}</span>
                  <h3>{item.name}</h3>
                  {item.location && (
                    <span className="meta">
                      <MapPin size={14} aria-hidden="true" />
                      {item.location}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {page.pageInfo.hasNextPage && (
            <div className="pagination">
              <button
                type="button"
                className="button button-secondary"
                disabled={loadingMore}
                onClick={() => void fetchMore({ variables: { after: page.pageInfo.endCursor } })}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
