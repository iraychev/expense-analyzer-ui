import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {colors} from "@/constants/Colors";
import { PieChart } from "react-native-chart-kit";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";
import { colorPalette } from "@/constants/Colors";

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
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonthMonth = lastMonthDate.getMonth();

        let last7DaysExpense = 0;
        let last30DaysExpense = 0;
        let currentMonthExpense = 0;
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

            if (txDate >= currentMonthStart && txDate <= now) {
              chartExpenseByCategory[tx.category] = (chartExpenseByCategory[tx.category] || 0) + absAmount;
            }
          }
        });

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
            });
          } else if (weekdayAverage > weekendAverage * 1.5) {
            newSuggestions.push({
              period: "WEEKDAY HABITS",
              text: `Your weekday spending (${formatNumber(
                weekdayAverage
              )} ${currency}/day) is much higher than weekends (${formatNumber(
                weekendAverage
              )} ${currency}/day). Look for ways to reduce daily work expenses like bringing lunch from home.`,
            });
          }
        }

        const topCategoryCurrentMonth = Object.entries(currentMonthExpenseByCategory).sort(([, a], [, b]) => b - a)[0];

        if (topCategoryCurrentMonth && currentMonthExpense > 0) {
          const [category, amount] = topCategoryCurrentMonth;
          const percentage = Math.round((amount / currentMonthExpense) * 100);

          if (percentage > 30) {
            newSuggestions.push({
              period: "THIS MONTH",
              text: `${percentage}% of your spending (${formatNumber(amount)} ${currency}) is on ${category}. ${
                ["Food", "Dining", "Restaurant", "Groceries"].some((c) => category.includes(c))
                  ? "Consider meal planning to reduce food costs."
                  : "Check if you can optimize this category."
              }`,
            });
          }
        }

        const lastMonthCategories = Object.keys(lastMonthExpenseByCategory);
        if (lastMonthCategories.length > 0 && Object.keys(currentMonthExpenseByCategory).length > 0) {
          for (const category of lastMonthCategories) {
            const lastMonthAmount = lastMonthExpenseByCategory[category] || 0;
            const currentMonthAmount = currentMonthExpenseByCategory[category] || 0;

            if (now.getDate() >= 10 && lastMonthAmount > 0) {
              const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const projectedAmount = (currentMonthAmount / now.getDate()) * daysInCurrentMonth;

              if (projectedAmount > lastMonthAmount * 1.3 && projectedAmount > 100) {
                newSuggestions.push({
                  period: "MONTH-OVER-MONTH",
                  text: `Your ${category} spending is trending ${formatNumber(
                    Math.round((projectedAmount / lastMonthAmount - 1) * 100)
                  )}% higher than last month. You might exceed last month's ${formatNumber(
                    lastMonthAmount
                  )} ${currency} if this continues.`,
                });
                break;
              }
            }
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
            legendFontColor: "#333",
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Expense Analyzer</Text>
            <Text style={styles.subtitle}>Track and optimize your spending wisely</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <>
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
                        labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
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
                            {`: ${item.amount} `}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noData}>No expense data available for last month</Text>
                )}
              </View>

              <Text style={styles.pageSection}>Smart Recommendations</Text>
              <View style={styles.sectionContainer}>
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionBox}>
                      <Text style={styles.tipPeriod}>{suggestion.period}</Text>
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.tipPeriod}>ANALYSIS</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 20, backgroundColor: colors.background },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.accent,
    marginBottom: 10,
    textAlign: "center",
  },
  headerContainer: { alignItems: "center", marginBottom: 25 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: { fontSize: 18, color: colors.text, textAlign: "center" },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.accent,
    marginTop: 10,
    marginBottom: 15,
    paddingLeft: 10,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    color: colors.text,
    textAlign: "center",
    marginVertical: 30,
    fontStyle: "italic",
  },
  chartWrapper: { alignItems: "center", width: "100%" },
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
  legendLabel: { fontSize: 13, color: "#333", flexShrink: 1 },
  legendCategory: { fontWeight: "600" },
  suggestionBox: {
    backgroundColor: "#F9F9F9",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
  },
  tipPeriod: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.accent,
    marginBottom: 6,
    letterSpacing: 1,
  },
  suggestionText: { fontSize: 15, lineHeight: 22, color: colors.text },
});
