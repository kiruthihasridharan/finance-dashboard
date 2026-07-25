"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowUpward,
  CurrencyExchange,
  Download,
  FileUpload,
  Insights,
  TrendingUp,
} from "@mui/icons-material";

const initialHoldings = [
  { id: 1, ticker: "AAPL", name: "Apple", shares: 12, costBasis: 145.5, price: 211.4, assetClass: "Equity", sector: "Technology", account: "Brokerage", dividendYield: 0.53 },
  { id: 2, ticker: "VOO", name: "Vanguard S&P 500", shares: 20, costBasis: 385.2, price: 412.6, assetClass: "ETF", sector: "Index", account: "IRA", dividendYield: 1.24 },
  { id: 3, ticker: "BTC", name: "Bitcoin", shares: 0.8, costBasis: 60000, price: 65500, assetClass: "Crypto", sector: "Digital Assets", account: "Exchange", dividendYield: 0 },
];

const performanceSeries = {
  "1M": [118000, 121500, 119800, 124200, 126900, 129400],
  YTD: [108000, 112500, 114700, 118900, 123600, 129400],
  "5Y": [76000, 87000, 96000, 111000, 124000, 129400],
};

const initialTransactions = [
  { id: 1, type: "Buy", ticker: "AAPL", shares: 12, price: 211.4, date: "Today" },
  { id: 2, type: "Dividend", ticker: "VOO", amount: 24.8, date: "Yesterday" },
];

const incomeHistory = [
  { id: 1, label: "Apple dividend", amount: 12.4, date: "Apr 12" },
  { id: 2, label: "VOO distribution", amount: 24.8, date: "Apr 08" },
  { id: 3, label: "Interest", amount: 6.2, date: "Apr 01" },
];

const goal = {
  target: 250000,
  current: 129400,
  label: "Net worth milestone",
};

export default function Home() {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedRange, setSelectedRange] = useState("YTD");
  const [statusMessage, setStatusMessage] = useState("Prices are syncing automatically from the market feed.");
  const [form, setForm] = useState({ ticker: "", shares: "", price: "", type: "Buy" });

  useEffect(() => {
    const refreshPrices = () => {
      setHoldings((prev) =>
        prev.map((item) => ({
          ...item,
          price: Math.max(1, item.price + (item.ticker === "BTC" ? 180 : 1.8) * (Math.random() > 0.5 ? 1 : -1)),
        }))
      );
    };

    refreshPrices();
  }, []);

  const portfolioValue = useMemo(() => holdings.reduce((sum, item) => sum + item.shares * item.price, 0), [holdings]);
  const costBasis = useMemo(() => holdings.reduce((sum, item) => sum + item.shares * item.costBasis, 0), [holdings]);
  const totalGain = portfolioValue - costBasis;
  const gainPercent = costBasis ? (totalGain / costBasis) * 100 : 0;
  const dividendIncome = useMemo(() => holdings.reduce((sum, item) => sum + item.shares * item.price * (item.dividendYield / 100) * 0.25, 0), [holdings]);

  const allocationByClass = useMemo(() => {
    const map = {};
    holdings.forEach((item) => {
      map[item.assetClass] = (map[item.assetClass] || 0) + item.shares * item.price;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const allocationBySector = useMemo(() => {
    const map = {};
    holdings.forEach((item) => {
      map[item.sector] = (map[item.sector] || 0) + item.shares * item.price;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const allocationByAccount = useMemo(() => {
    const map = {};
    holdings.forEach((item) => {
      map[item.account] = (map[item.account] || 0) + item.shares * item.price;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const topGainer = useMemo(() => {
    const rows = holdings.map((item) => ({
      ...item,
      gain: item.shares * item.price - item.shares * item.costBasis,
    }));
    return rows.reduce((best, current) => (current.gain > best.gain ? current : best), rows[0]);
  }, [holdings]);

  const topLoser = useMemo(() => {
    const rows = holdings.map((item) => ({
      ...item,
      gain: item.shares * item.price - item.shares * item.costBasis,
    }));
    return rows.reduce((worst, current) => (current.gain < worst.gain ? current : worst), rows[0]);
  }, [holdings]);

  const handleImportHoldings = () => {
    setStatusMessage("Imported 3 sample holdings from CSV and refreshed current prices.");
  };

  const handleAddTransaction = (event) => {
    event.preventDefault();
    if (!form.ticker || !form.shares || !form.price) return;

    const ticker = form.ticker.toUpperCase();
    const shares = Number(form.shares);
    const price = Number(form.price);

    setHoldings((prev) => {
      const existing = prev.find((item) => item.ticker === ticker);
      if (!existing) {
        return [
          ...prev,
          {
            id: Date.now(),
            ticker,
            name: ticker,
            shares,
            costBasis: price,
            price,
            assetClass: "New",
            sector: "Manual",
            account: "Manual",
            dividendYield: 0,
          },
        ];
      }

      if (form.type === "Buy") {
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                shares: item.shares + shares,
                costBasis: (item.shares * item.costBasis + shares * price) / (item.shares + shares),
                price,
              }
            : item
        );
      }

      return prev
        .map((item) => (item.id === existing.id ? { ...item, shares: Math.max(0, item.shares - shares) } : item))
        .filter((item) => item.shares > 0);
    });

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: form.type,
        ticker,
        shares,
        price,
        date: "Just now",
      },
      ...prev,
    ]);

    setForm({ ticker: "", shares: "", price: "", type: "Buy" });
    setStatusMessage(`${form.type} transaction recorded and portfolio recalculated.`);
  };

  const formatCurrency = (value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const formatPercent = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const chartPoints = performanceSeries[selectedRange];
  const maxPoint = Math.max(...chartPoints);
  const minPoint = Math.min(...chartPoints);
  const chartWidth = 420;
  const chartHeight = 220;
  const points = chartPoints
    .map((value, index) => {
      const x = (index / (chartPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((value - minPoint) / (maxPoint - minPoint || 1)) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", p: { xs: 2, md: 4 } }}>
      <Paper elevation={0} sx={{ maxWidth: 1400, mx: "auto", borderRadius: 4, p: { xs: 2.5, md: 4 }, border: "1px solid #e5e7eb", bgcolor: "rgba(255,255,255,0.95)" }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }} spacing={2} mb={3}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.5}>
              Investment Portfolio Tracker
            </Typography>
            <Typography variant="h4" fontWeight={700} color="#0f172a">
              Personal wealth dashboard
            </Typography>
            <Typography color="text.secondary" mt={0.5}>
              Consolidate holdings, monitor returns, and track progress toward financial goals from one view.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="outlined" startIcon={<FileUpload />} onClick={handleImportHoldings}>
              Import holdings
            </Button>
            <Button variant="contained" startIcon={<Download />}>
              Export report
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2} mb={3}>
          <Alert severity="success" sx={{ borderRadius: 3 }}>
            {statusMessage}
          </Alert>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
          <Box sx={{ flex: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {[
                  { title: "Total value", value: formatCurrency(portfolioValue), change: formatPercent(gainPercent), icon: <CurrencyExchange /> },
                  { title: "Total gain", value: formatCurrency(totalGain), change: formatPercent(gainPercent), icon: <ArrowUpward /> },
                  { title: "Dividend income", value: formatCurrency(dividendIncome), change: "+4.2% YTD", icon: <TrendingUp /> },
                  { title: "Net worth goal", value: formatCurrency(goal.current), change: `${Math.round((goal.current / goal.target) * 100)}% of target`, icon: <Insights /> },
                ].map((metric) => (
                  <Paper key={metric.title} variant="outlined" sx={{ flex: 1, borderRadius: 3, p: 2.2 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }} mb={1.5}>
                      <Typography variant="subtitle2" color="text.secondary">{metric.title}</Typography>
                      <Box sx={{ color: "primary.main" }}>{metric.icon}</Box>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>{metric.value}</Typography>
                    <Typography variant="body2" color="primary" mt={0.5}>{metric.change}</Typography>
                  </Paper>
                ))}
              </Stack>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }} spacing={2} mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Historical performance</Typography>
                    <Typography variant="body2" color="text.secondary">Track value growth across 1 month, YTD, and 5 year ranges.</Typography>
                  </Box>
                  <Tabs value={selectedRange} onChange={(_, value) => setSelectedRange(value)}>
                    <Tab label="1M" value="1M" />
                    <Tab label="YTD" value="YTD" />
                    <Tab label="5Y" value="5Y" />
                  </Tabs>
                </Stack>
                <Box sx={{ width: "100%", overflow: "hidden" }}>
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="220">
                    <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="#e5e7eb" />
                    <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={points} />
                  </svg>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">Portfolio value rose from {formatCurrency(minPoint)} to {formatCurrency(maxPoint)} across the selected period.</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Holdings</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticker</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell>Shares</TableCell>
                      <TableCell>Current price</TableCell>
                      <TableCell align="right">Gain/Loss</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holdings.map((item) => {
                      const gain = item.shares * item.price - item.shares * item.costBasis;
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.ticker}</TableCell>
                          <TableCell>{item.account}</TableCell>
                          <TableCell>{item.shares}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right" sx={{ color: gain >= 0 ? "success.main" : "error.main", fontWeight: 600 }}>
                            {formatCurrency(gain)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ width: { xs: "100%", lg: 360 } }}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Asset allocation</Typography>
                <Stack spacing={1.5}>
                  {allocationByClass.map((item) => (
                    <Box key={item.name}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }} mb={0.6}>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatCurrency(item.value)}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(item.value / portfolioValue) * 100} sx={{ height: 8, borderRadius: 999, bgcolor: "#e5e7eb" }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Sector and account mix</Typography>
                <Stack spacing={1.5}>
                  {[...allocationBySector, ...allocationByAccount].slice(0, 6).map((item) => (
                    <Box key={item.name}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }} mb={0.6}>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatCurrency(item.value)}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(item.value / portfolioValue) * 100} sx={{ height: 6, borderRadius: 999, bgcolor: "#e5e7eb" }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Goal tracker</Typography>
                <Typography variant="body2" color="text.secondary">{goal.label}</Typography>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }} mt={1} mb={1}>
                  <Typography variant="h6" fontWeight={700}>{formatCurrency(goal.current)}</Typography>
                  <Typography variant="body2" color="text.secondary">Target {formatCurrency(goal.target)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(goal.current / goal.target) * 100} sx={{ height: 10, borderRadius: 999 }} />
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Top movers</Typography>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="subtitle2">Top gainer</Typography>
                    <Typography fontWeight={700}>{topGainer?.ticker}</Typography>
                    <Typography variant="body2" color="success.main">{formatCurrency(topGainer?.shares * topGainer?.price - topGainer?.shares * topGainer?.costBasis)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Top loser</Typography>
                    <Typography fontWeight={700}>{topLoser?.ticker}</Typography>
                    <Typography variant="body2" color="error.main">{formatCurrency(topLoser?.shares * topLoser?.price - topLoser?.shares * topLoser?.costBasis)}</Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Add transaction</Typography>
                <Box component="form" onSubmit={handleAddTransaction} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField label="Ticker" value={form.ticker} onChange={(event) => setForm((prev) => ({ ...prev, ticker: event.target.value }))} size="small" required />
                  <TextField label="Shares" type="number" value={form.shares} onChange={(event) => setForm((prev) => ({ ...prev, shares: event.target.value }))} size="small" required />
                  <TextField label="Price" type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} size="small" required />
                  <FormControl size="small">
                    <InputLabel>Type</InputLabel>
                    <Select value={form.type} label="Type" onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                      <MenuItem value="Buy">Buy</MenuItem>
                      <MenuItem value="Sell">Sell</MenuItem>
                      <MenuItem value="Dividend">Dividend</MenuItem>
                    </Select>
                  </FormControl>
                  <Button type="submit" variant="contained">Save transaction</Button>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Recent activity</Typography>
                <Stack spacing={1}>
                  {transactions.map((item) => (
                    <Box key={item.id} sx={{ border: "1px solid #eef2f7", borderRadius: 2, p: 1.2 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight={600}>{item.type} • {item.ticker}</Typography>
                        <Chip label={item.date} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" mt={0.4}>
                        {item.shares ? `${item.shares} shares @ ${formatCurrency(item.price)}` : `${formatCurrency(item.amount || 0)} cash flow`}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Dividend / Interest tracker</Typography>
                <Stack spacing={1}>
                  {incomeHistory.map((item) => (
                    <Stack key={item.id} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>{formatCurrency(item.amount)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
