const core = require("@actions/core");
const github = require("@actions/github");
const { exec } = require("@actions/exec");

const token = core.getInput("token");
const octokit = github.getOctokit(token);

const { issue, repo } = github.context;

const output = {
    stdout: "",
    stderr: "",
};

const options = {
    listeners: {
        stdout: (data) => (output.stdout += data.toString()),
        stderr: (data) => (output.stderr += data.toString()),
    },
};

async function installPyCodeStyle() {
    try {
        await exec("pip", ["install", "pycodestyle"]);
    } catch (error) {
        core.setFailed("Failed to install pycodestyle.");
    }
}

async function getPreviousReviews() {
    try {
        const { data } = await octokit.rest.pulls.listReviews({
            pull_number: issue.number,
            owner: repo.owner,
            repo: repo.repo,
        });

        console.log(data);

        return data.filter((review) => review.user.login === "github-actions[bot]");
    } catch (error) {
        console.error(error);
    }
}

async function deleteReview(reviewID) {
    try {
        const { data } = await octokit.rest.pulls.deletePendingReview({
            pull_number: issue.number,
            owner: repo.owner,
            repo: repo.repo,
            review_id: reviewID,
        });

        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

function getComments(pycodestyleOutput) {
    const comments = pycodestyleOutput
        .split(/\n/)
        .map((l) => {
            const [path, line, position, body] = l.split(":");

            if (typeof path !== "string" || path.length <= 2) return undefined;
            if (typeof line !== "string" && Number.parseInt(line) === NaN) return undefined;
            if (typeof position !== "string" && Number.parseInt(position) === NaN) return undefined;
            if (typeof body !== "string" || path.length <= 1) return undefined;

            const comment = {
                path: path.substring(2),
                line: Number.parseInt(line),
                body: body.substring(1),
            };

            return comment;
        })
        .filter((c) => c !== undefined);

    console.log(comments);

    return comments;
}

async function createReview() {
    try {
        const { data } = await octokit.rest.pulls.createReview({
            pull_number: issue.number,
            owner: repo.owner,
            repo: repo.repo,
            event: "REQUEST_CHANGES",
            comments: getComments(output.stdout),
        });
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await installPyCodeStyle();

    let exit_code = 0;

    try {
        await exec("pycodestyle", [core.getInput("arguments"), "."], options);
    } catch (error) {
        exit_code = 1;

        // Delete previous review if it exists
        const previousReviews = await getPreviousReviews();
        if (previousReviews !== undefined) {
            previousReviews.forEach(async review => await deleteReview(review.id))
        }

        // Create the new review
        await createReview();

        core.setFailed(output.stderr);
    }

    core.setOutput("exit-code", exit_code);
    core.setOutput("output", output.stdout);
}

run();
