# Automating the job search with Puppeteer
- So far I only have the webscraper applying to jobs on Indeed.  I will slowly add more job boards.  Right now, only jobs that you can apply through Indeed will automatically be applied to.
- Jobs are scraped under the assumption that you've made an account and have your profile set up on whichever job board because the webscraper connects to your local browser instance.  It does this by running a debugging websocket connection to interact with your browser.  This saves you from signing in every time you run this script.  Indeed has re/captcha on the login page.

### Future Features
- save the jobs that have been applied to to a google doc
- keep track of jobs you should apply to manually on companies' websites on another google doc
    - check this doc before adding more jobs
- Once a job has been applied to, go to LinkedIn and send an outreach message to a recruiter or an employee for an informational interview.
