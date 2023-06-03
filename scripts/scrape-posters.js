import fs from 'fs'

import fetch from 'node-fetch'

import * as cheerio from 'cheerio'

const posterIdsPath = 'indexes/external-cs-it-to-parse-poster-ids.json';
const posterIds = JSON.parse(fs.readFileSync(posterIdsPath));

// if never run before, these files need to exist with just `[]` as their content
const scrapedPostersPath = 'data/posters.json';
const scrapedPosterIdsPath = 'data/scraped-poster-ids.json';

let scrapedPosters = JSON.parse(fs.readFileSync(scrapedPostersPath));
let scrapedPosterIds = JSON.parse(fs.readFileSync(scrapedPosterIdsPath));

// scrape first ten poster IDs that haven't already been scraped
// (we limit to ten partly to avoid memory issues—could just read/write the poster list with every scrape)
const posterIdsToScrape = posterIds.filter(id => ! scrapedPosterIds.includes(id)).slice(0, 10)

for (const posterId of posterIdsToScrape) {
	const scrapedPoster = await scrapePoster(posterId);
	const scrapedPosterContent = extractPosterContent(scrapedPoster);

	scrapedPosters.push({
		id: posterId,
		...scrapedPosterContent
	});
	scrapedPosterIds.push(posterId);

	console.log(`scraped ${posterId}`)
}

async function scrapePoster(posterId) {
	// from: https://www.sitepoint.com/delay-sleep-pause-wait/
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	await sleep(1000);

	const response = await fetch(`https://emploisfp-psjobs.cfp-psc.gc.ca/psrs-srfp/applicant/page1800?poster=${posterId}`);
	const body = await response.text();

	return body;
}

function extractPosterContent(posterHtml) {
	const $ = cheerio.load(posterHtml)

	return {
		html: $('main').html(),
		// text: $('main').text(), // we can do this in post
	}
}

fs.writeFileSync(scrapedPostersPath, JSON.stringify(scrapedPosters, null, 2));
fs.writeFileSync(scrapedPosterIdsPath, JSON.stringify(scrapedPosterIds, null, 2));
