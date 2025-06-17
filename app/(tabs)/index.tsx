import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, colorPalette } from "@/constants/Colors";
import PieChart from "@/components/PieChart";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchAnalysis, AnalysisItem } from "@/api/analysisService";

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};

export default function Index() {
  const { transactions, isLoading: loading, refreshTransactions } = useTransactions();
  const [greeting, setGreeting] = useState("");
  const [suggestions, setSuggestions] = useState<AnalysisItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [selectedMonthView, setSelectedMonthView] = useState<"current" | "previous">("current");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    AsyncStorage.getItem("username").then((storedUsername) => {
      const name = storedUsername ? storedUsername : "";
      setGreeting(`Good ${timeOfDay}${name ? `, ${name}` : ""}!`);
    });
  }, []);
  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const analyzeTransactions = async () => {
      try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        let currentMonthExpense = 0;
        let lastMonthExpense = 0;

        const currentMonthExpenseByCategory: Record<string, number> = {};
        const lastMonthExpenseByCategory: Record<string, number> = {};

        transactions.forEach((tx) => {
          if (tx.amount < 0) {
            const absAmount = Math.abs(tx.amount);
            const txDate = new Date(tx.valueDate);

            if (txDate >= currentMonthStart && txDate <= now) {
              currentMonthExpense += absAmount;
              currentMonthExpenseByCategory[tx.category] =
                (currentMonthExpenseByCategory[tx.category] || 0) + absAmount;
            }

            if (txDate >= lastMonthStart && txDate <= lastMonthEnd) {
              lastMonthExpense += absAmount;
              lastMonthExpenseByCategory[tx.category] = (lastMonthExpenseByCategory[tx.category] || 0) + absAmount;
            }
          }
        });

        setCurrentMonthTotal(currentMonthExpense);
        setLastMonthTotal(lastMonthExpense);
        const change = lastMonthExpense > 0 ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
        setPercentageChange(change);

        const displayData =
          selectedMonthView === "current"
            ? {
                total: currentMonthExpense,
                expenseByCategory: currentMonthExpenseByCategory,
                label: "This Month",
              }
            : {
                total: lastMonthExpense,
                expenseByCategory: lastMonthExpenseByCategory,
                label: "Last Month",
              };

        const chartArray = Object.keys(displayData.expenseByCategory)
          .sort((a, b) => displayData.expenseByCategory[b] - displayData.expenseByCategory[a])
          .map((category, index) => ({
            name: category,
            amount: formatNumber(displayData.expenseByCategory[category]),
            value: parseFloat(displayData.expenseByCategory[category].toFixed(2)),
            color: colorPalette[index % colorPalette.length],
            legendFontColor: colors.text,
            legendFontSize: 12,
          }));

        setChartData(chartArray);
      } catch (error: any) {
        console.error("Failed to analyze transactions", error.message);
      }
    };

    analyzeTransactions();
  }, [transactions, loading, selectedMonthView]);

  // Fetch analysis recommendations from API
  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const loadAnalysis = async () => {
      try {
        setAnalysisLoading(true);
        const analysisData = await fetchAnalysis();
        setSuggestions(analysisData);
      } catch (error: any) {
        console.error("Failed to fetch analysis data", error.message);
        setSuggestions([]);
      } finally {
        setAnalysisLoading(false);
      }
    };

    loadAnalysis();
  }, [transactions, loading]);

  useEffect(() => {
    refreshTransactions();
  }, []);

  return (
    <>
      <Head>
        <title>Analysis - Expense Analyzer</title>
      </Head>
      <LinearGradient
        colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Expense Analyzer</Text>
              <Text style={styles.subtitle}>Track and optimize your spending wisely</Text>
            </View>

            <Text style={styles.greeting}>{greeting}</Text>

            {loading ? (
              <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
            ) : (
              <>
                {transactions.length > 0 ? (
                  <>
                    {/* Balance Card*/}
                    <View style={styles.balanceCard}>
                      <LinearGradient
                        colors={[colors.info, colors.primaryDark]}
                        style={styles.balanceGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.monthToggleContainer}>
                          <TouchableOpacity
                            style={[
                              styles.monthToggleButton,
                              selectedMonthView === "current" && styles.monthToggleButtonActive,
                            ]}
                            onPress={() => setSelectedMonthView("current")}
                          >
                            <Text
                              style={[
                                styles.monthToggleText,
                                selectedMonthView === "current" && styles.monthToggleTextActive,
                              ]}
                            >
                              This Month
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.monthToggleButton,
                              selectedMonthView === "previous" && styles.monthToggleButtonActive,
                            ]}
                            onPress={() => setSelectedMonthView("previous")}
                          >
                            <Text
                              style={[
                                styles.monthToggleText,
                                selectedMonthView === "previous" && styles.monthToggleTextActive,
                              ]}
                            >
                              Last Month
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.balanceAmount}>
                          -{formatNumber(selectedMonthView === "current" ? currentMonthTotal : lastMonthTotal)}{" "}
                          {transactions[0]?.currency || "EUR"}
                        </Text>

                        {selectedMonthView === "current" && (
                          <View style={styles.balanceComparison}>
                            <Ionicons
                              name={percentageChange > 0 ? "arrow-up" : "arrow-down"}
                              size={16}
                              color={colors.white}
                            />
                            <Text style={styles.comparisonText}>
                              {Math.abs(percentageChange).toFixed(1)}% vs last month
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </View>
                    <View style={styles.sectionHeaderContainer}>
                      <Text style={styles.pageSection}>Insights</Text>
                      <TouchableOpacity style={styles.seeMoreButton} onPress={() => router.push("/transactions")}>
                        <Text style={styles.seeMoreButtonText}>See Transactions</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>📊 Expense Breakdown</Text>
                      {chartData.length > 0 ? (
                        <View style={styles.chartWrapper}>
                          <PieChart data={chartData} width={screenWidth - 60} height={220} />
                          <View style={styles.customLegend}>
                            {chartData.map((item, index) => (
                              <View key={index} style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                <Text style={styles.legendLabel}>
                                  <Text style={styles.legendCategory}>{item.name}</Text>
                                  {`: ${item.amount} ${transactions[0]?.currency || ""}`}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.totalContainer}>
                            <Text style={styles.totalAmount}>
                              Total: {formatNumber(chartData.reduce((sum, item) => sum + item.value, 0))}{" "}
                              {transactions[0]?.currency || ""}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.noData}>No expense data available for this month</Text>
                      )}
                    </View>{" "}
                    <Text style={styles.pageSection}>Smart Recommendations</Text>
                    <View style={styles.sectionContainer}>
                      {analysisLoading ? (
                        <View style={styles.analysisLoadingContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={styles.analysisLoadingText}>Generating insights...</Text>
                        </View>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <View key={index} style={styles.suggestionBox}>
                            <View style={styles.suggestionHeader}>
                              <Ionicons name={suggestion.icon as any} size={20} color={colors.primary} />
                              <Text style={styles.tipPeriod}>{suggestion.period}</Text>
                            </View>
                            <Text style={styles.suggestionText}>{suggestion.text}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.suggestionBox}>
                          <View style={styles.suggestionHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={styles.tipPeriod}>ANALYSIS</Text>
                          </View>
                          <Text style={styles.suggestionText}>
                            🎉 No specific recommendations available. Keep up the good work!
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.sectionContainer}>
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons name="analytics-outline" size={50} color={colors.textMuted} />
                      </View>
                      <Text style={styles.noDataTitle}>No transaction data yet</Text>
                      <Text style={styles.noData}>
                        Connect your bank accounts to start tracking and analyzing your expenses automatically
                      </Text>
                      <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/bankConnections")}>
                        <Ionicons name="link-outline" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>Add Bank Connection</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: { flexGrow: 1, padding: 20 },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 25,
    textAlign: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    textAlign: "center",
    opacity: 0.9,
  },
  balanceCard: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceGradient: {
    padding: 25,
    alignItems: "center",
  },
  monthToggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 15,
    padding: 4,
  },
  monthToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  monthToggleButtonActive: {
    backgroundColor: colors.white,
  },
  monthToggleText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  monthToggleTextActive: {
    color: colors.primary,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 10,
  },
  balanceComparison: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comparisonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 20,
    marginBottom: 20,
    paddingLeft: 10,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  seeMoreButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  sectionContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 35,
    width: "100%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: colors.primary,
    textAlign: "center",
  },
  loader: { marginTop: 40 },
  noData: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginHorizontal: 20,
    lineHeight: 22,
    marginBottom: 30,
  },
  chartWrapper: { alignItems: "center", width: "100%" },
  totalContainer: {
    marginTop: 25,
    marginBottom: 10,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: colors.primary + "08",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + "20",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  customLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 5,
    width: "45%",
  },
  legendColor: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  legendLabel: { fontSize: 13, color: colors.text, flexShrink: 1 },
  legendCategory: { fontWeight: "600" },
  suggestionBox: {
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipPeriod: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 1,
    marginLeft: 8,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    marginVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 30,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  analysisLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  analysisLoadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 10,
  },
});
