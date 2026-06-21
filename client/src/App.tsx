import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Threats from "@/pages/Threats";
import Compliance from "@/pages/Compliance";
import TechStack from "@/pages/TechStack";
import Incidents from "@/pages/Incidents";
import BoardReport from "@/pages/BoardReport";
import Assessment from "@/pages/Assessment";
import Connectors from "@/pages/Connectors";
import Agents from "@/pages/Agents";
import TalentMarketplace from "@/pages/TalentMarketplace";
import Procurement from "@/pages/Procurement";
import CyberNews from "@/pages/CyberNews";
import ThreatIngestion from "@/pages/ThreatIngestion";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          {/* Landing page — no Layout wrapper */}
          <Route path="/" component={Landing} />

          {/* Platform app — all routes under /app prefixed paths wrapped in Layout */}
          <Route path="/app">
            {() => (
              <Layout>
                <Dashboard />
              </Layout>
            )}
          </Route>
          <Route path="/app/threats">
            {() => <Layout><Threats /></Layout>}
          </Route>
          <Route path="/app/compliance">
            {() => <Layout><Compliance /></Layout>}
          </Route>
          <Route path="/app/tech-stack">
            {() => <Layout><TechStack /></Layout>}
          </Route>
          <Route path="/app/incidents">
            {() => <Layout><Incidents /></Layout>}
          </Route>
          <Route path="/app/board-report">
            {() => <Layout><BoardReport /></Layout>}
          </Route>
          <Route path="/app/assessment">
            {() => <Layout><Assessment /></Layout>}
          </Route>
          <Route path="/app/connectors">
            {() => <Layout><Connectors /></Layout>}
          </Route>
          <Route path="/app/agents">
            {() => <Layout><Agents /></Layout>}
          </Route>
          <Route path="/app/talent">
            {() => <Layout><TalentMarketplace /></Layout>}
          </Route>
          <Route path="/app/procurement">
            {() => <Layout><Procurement /></Layout>}
          </Route>
          <Route path="/app/news">
            {() => <Layout><CyberNews /></Layout>}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
