export default function AboutView() {
    return (
      <section className="view active" aria-labelledby="aboutHeading">
        <div className="grid">
          <article className="card">
            <h2 id="aboutHeading">
              Team Information <span className="pill">Team 18</span>
            </h2>
            <div className="kvs">
              <p><strong>Team #:</strong> 18</p>
              <p><strong>Version # (Sprint #):</strong> 2</p>
              <p><strong>Release Date:</strong> 09/22/2025</p>
            </div>
          </article>
  
          <article className="card">
            <h2>Product Information</h2>
            <div className="kvs">
              <p><strong>Product Name:</strong> Truck Points</p>
              <p>
                <strong>Product Description:</strong> An online portal that partners drivers with sponsors to reward safe, high-performance driving. Drivers earn points with monetary value and redeem them for items in their sponsor’s curated catalog.
              </p>
            </div>
          </article>
  
          <article className="card">
            <h2>Why It Matters</h2>
            <p>
              Improving on-road performance reduces risk, increases safety, and rewards great drivers. Sponsors gain configurable programs, live catalogs via public APIs, and rich reporting—admins get end-to-end visibility.
            </p>
          </article>
  
          <article className="card">
            <h2>What’s Inside</h2>
            <ul style={{ margin: "8px 0 0 18px" }}>
              <li>Driver points & redemption</li>
              <li>Sponsor-managed product catalogs (live price/availability)</li>
              <li>Audit logs & secure auth flows</li>
              <li>Downloadable, visually rich reports</li>
            </ul>
          </article>
        </div>
      </section>
    );
  }
  