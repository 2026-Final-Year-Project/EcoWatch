import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(moduleDirectory, "../../data/community-reports.json");
export const CLUSTER_RADIUS_METRES = 250;

function readSites() {
  return JSON.parse(readFileSync(storePath, "utf8"));
}

function writeSites(sites) {
  const temporaryPath = `${storePath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(sites, null, 2));
  renameSync(temporaryPath, storePath);
}

function distanceMetres(latitudeA, longitudeA, latitudeB, longitudeB) {
  const earthRadius = 6_371_000;
  const radians = (value) => value * Math.PI / 180;
  const deltaLatitude = radians(latitudeB - latitudeA);
  const deltaLongitude = radians(longitudeB - longitudeA);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function communityCorroboration(reportCount) {
  // This measures agreement among reports, not a probability that mining is illegal.
  return Math.round(100 * (1 - Math.exp(-reportCount / 4)));
}

export function listCommunitySites() {
  return readSites()
    .map((site) => ({ ...site, communityCorroboration: communityCorroboration(site.reportCount) }))
    .sort((left, right) => new Date(right.lastReportedAt) - new Date(left.lastReportedAt));
}

export function addCommunityReport({ latitude, longitude, accuracy, notes, reporterId }) {
  const sites = readSites();
  const now = new Date().toISOString();
  const report = { id: randomUUID(), reporterId, latitude, longitude, accuracy: accuracy || null, notes: notes?.trim() || null, reportedAt: now };
  const site = sites.find((candidate) => distanceMetres(latitude, longitude, candidate.latitude, candidate.longitude) <= CLUSTER_RADIUS_METRES);

  if (site) {
    if (site.reports.some((existingReport) => existingReport.reporterId === reporterId)) {
      const error = new Error("You have already reported this site. Additional reports from the same account do not increase corroboration.");
      error.status = 409;
      throw error;
    }
    const priorReportCount = site.reports.length;
    // Keep the cluster marker and model query centred on all observations,
    // instead of permanently anchoring a site to its first reporter.
    site.latitude = (site.latitude * priorReportCount + latitude) / (priorReportCount + 1);
    site.longitude = (site.longitude * priorReportCount + longitude) / (priorReportCount + 1);
    site.reports.push(report);
    site.reportCount = site.reports.length;
    site.lastReportedAt = now;
    writeSites(sites);
    return { site, isNewSite: false };
  }

  const newSite = {
    id: randomUUID(), latitude, longitude, reportCount: 1,
    firstReportedAt: now, lastReportedAt: now, reports: [report], latestPrediction: null,
  };
  sites.push(newSite);
  writeSites(sites);
  return { site: newSite, isNewSite: true };
}

export function saveSitePrediction(siteId, prediction) {
  const sites = readSites();
  const site = sites.find((candidate) => candidate.id === siteId);
  if (!site) return null;
  site.latestPrediction = { ...prediction, analysedAt: new Date().toISOString() };
  writeSites(sites);
  return site;
}
