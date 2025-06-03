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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/Colors";
import { PieChart } from "react-native-chart-kit";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";
import { colorPalette } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};

export default function Index() {
  const { transactions, isLoading: loading } = useTransactions();
  const [greeting, setGreeting] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const screenWidth = Dimensions.get("window").width;

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
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        let last7DaysExpense = 0;
        let last30DaysExpense = 0;
        let currentMonthExpense = 0;
        let lastMonthExpense = 0;
        let weekend30DaysExpense = 0;
        let weekday30DaysExpense = 0;
        let weekendDaysCount = 0;
        let weekdayDaysCount = 0;

        const currentMonthExpenseByCategory: Record<string, number> = {};
        const lastMonthExpenseByCategory: Record<string, number> = {};
        const chartExpenseByCategory: Record<string, number> = {};

        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          date.getDay() === 0 || date.getDay() === 6 ? weekendDaysCount++ : weekdayDaysCount++;
        }

        transactions.forEach((tx) => {
          if (tx.amount < 0) {
            const absAmount = Math.abs(tx.amount);
            const txDate = new Date(tx.valueDate);

            if (txDate >= sevenDaysAgo && txDate <= now) {
              last7DaysExpense += absAmount;
            }

            if (txDate >= thirtyDaysAgo && txDate <= now) {
              last30DaysExpense += absAmount;
              const dayOfWeek = txDate.getDay();
              dayOfWeek === 0 || dayOfWeek === 6
                ? (weekend30DaysExpense += absAmount)
                : (weekday30DaysExpense += absAmount);
            }

            if (txDate >= currentMonthStart && txDate <= now) {
              currentMonthExpense += absAmount;
              currentMonthExpenseByCategory[tx.category] =
                (currentMonthExpenseByCategory[tx.category] || 0) + absAmount;
            }

            if (txDate >= lastMonthStart && txDate <= lastMonthEnd) {
              lastMonthExpense += absAmount;
              lastMonthExpenseByCategory[tx.category] = (lastMonthExpenseByCategory[tx.category] || 0) + absAmount;
            }

            if (txDate >= currentMonthStart && txDate <= now) {
              chartExpenseByCategory[tx.category] = (chartExpenseByCategory[tx.category] || 0) + absAmount;
            }
          }
        });

        setCurrentMonthTotal(currentMonthExpense);
        setLastMonthTotal(lastMonthExpense);
        const change = lastMonthExpense > 0 ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
        setPercentageChange(change);

        const weekdayAverage = weekday30DaysExpense / weekdayDaysCount;
        const weekendAverage = weekend30DaysExpense / weekendDaysCount;
        const currency = transactions[0]?.currency || "";
        const newSuggestions: any[] = [];

        if (last7DaysExpense > 0) {
          const dailyAverage = last7DaysExpense / 7;
          newSuggestions.push({
            period: "LAST 7 DAYS",
            text: `You've spent ${formatNumber(last7DaysExpense)} ${currency} (avg ${formatNumber(
              dailyAverage
            )}/day). ${
              dailyAverage > 50 ? "Consider setting daily spending limits." : "Keep maintaining this spending pattern."
            }`,
            icon: "trending-up",
          });
        }

        if (weekend30DaysExpense > 0 || weekday30DaysExpense > 0) {
          if (weekendAverage > weekdayAverage * 1.5) {
            newSuggestions.push({
              period: "WEEKEND HABITS",
              text: `Your weekend spending (${formatNumber(
                weekendAverage
              )} ${currency}/day) is significantly higher than weekdays (${formatNumber(
                weekdayAverage
              )} ${currency}/day). Try planning free or low-cost weekend activities.`,
              icon: "calendar",
            });
          } else if (weekdayAverage > weekendAverage * 1.5) {
            newSuggestions.push({
              period: "WEEKDAY HABITS",
              text: `Your weekday spending (${formatNumber(
                weekdayAverage
              )} ${currency}/day) is much higher than weekends (${formatNumber(
                weekendAverage
              )} ${currency}/day). Look for ways to reduce daily work expenses like bringing lunch from home.`,
              icon: "briefcase",
            });
          }
        }

        const topCategoryCurrentMonth = Object.entries(currentMonthExpenseByCategory).sort(([, a], [, b]) => b - a)[0];

        if (topCategoryCurrentMonth && currentMonthExpense > 0) {
          const [category, amount] = topCategoryCurrentMonth;
          const percentage = Math.round((amount / currentMonthExpense) * 100);

          if (percentage > 30) {
            newSuggestions.push({
              period: "TOP CATEGORY",
              text: `${percentage}% of your spending (${formatNumber(amount)} ${currency}) is on ${category}. ${
                ["Food", "Dining", "Restaurant", "Groceries"].some((c) => category.includes(c))
                  ? "Consider meal planning to reduce food costs."
                  : "Check if you can optimize this category."
              }`,
              icon: "pie-chart",
            });
          }
        }

        setSuggestions(newSuggestions);

        const chartArray = Object.keys(chartExpenseByCategory)
          .sort((a, b) => chartExpenseByCategory[b] - chartExpenseByCategory[a])
          .map((category, index) => ({
            name: category,
            amount: formatNumber(chartExpenseByCategory[category]),
            value: parseFloat(chartExpenseByCategory[category].toFixed(2)),
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
  }, [transactions, loading]);

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
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                  <LinearGradient
                    colors={[colors.info, colors.primaryDark]}
                    style={styles.balanceGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.balanceLabel}>This Month</Text>
                    <Text style={styles.balanceAmount}>
                      -{formatNumber(currentMonthTotal)} {transactions[0]?.currency || "EUR"}
                    </Text>
                    <View style={styles.balanceComparison}>
                      <Ionicons
                        name={percentageChange > 0 ? "arrow-up" : "arrow-down"}
                        size={16}
                        color={colors.white}
                      />
                      <Text style={styles.comparisonText}>{Math.abs(percentageChange).toFixed(1)}% vs last month</Text>
                    </View>
                  </LinearGradient>
                </View>

                <Text style={styles.pageSection}>Spending Insights</Text>
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>📊 This Month Breakdown</Text>
                  {chartData.length > 0 ? (
                    <View style={styles.chartWrapper}>
                      <PieChart
                        data={chartData}
                        width={screenWidth - 20}
                        height={220}
                        chartConfig={{
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                        }}
                        accessor="value"
                        backgroundColor="transparent"
                        paddingLeft="0"
                        center={[screenWidth / 4, 0]}
                        absolute
                        hasLegend={false}
                      />
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
                </View>

                <Text style={styles.pageSection}>Smart Recommendations</Text>
                <View style={styles.sectionContainer}>
                  {suggestions.length > 0 ? (
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
  safeArea: { flex: 1 },
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
  balanceLabel: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 5,
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
    marginVertical: 30,
    fontStyle: "italic",
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
});
