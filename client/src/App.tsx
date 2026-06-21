import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Threats from "@/pages/Threats";
import Compliance from "@/pages/Compliance";
import TechStack from "@/pages/TechStack";
import Incidents from "@/pages/Incidents";
import BoardReport from "@/pages/BoardReport";
import Assessment from "@/pages/Assessment";
import Connectors from "@/pages/Connectors";
import Agents from "@/pages/Agents";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/threats" component={Threats} />
            <Route path="/compliance" component={Compliance} />
            <Route path="/tech-stack" component={TechStack} />
            <Route path="/incidents" component={Incidents} />
            <Route path="/board-report" component={BoardReport} />
            <Route path="/assessment" component={Assessment} />
            <Route path="/connectors" component={Connectors} />
            <Route path="/agents" component={Agents} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
