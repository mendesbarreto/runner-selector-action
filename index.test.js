const { checkRunner } = require("./index");
const mockGetJson = jest.fn();

jest.mock("@actions/http-client", () => {
	return {
		HttpClient: jest.fn().mockImplementation(() => {
			return {
				getJson: mockGetJson,
			};
		}),
		BearerCredentialHandler: jest.fn(),
	};
});

describe("checkRunner", () => {
	it("should use the primary runner if it is online", async () => {
		mockGetJson.mockResolvedValue({
			statusCode: 200,
			result: {
				runners: [
					{
						status: "online",
						labels: [{ name: "self-hosted" }, { name: "linux" }],
					},
				],
			},
		});

		const result = await checkRunner({
			token: "fake-token",
			owner: "fake-owner",
			repo: "fake-repo",
			primaryRunner: ["self-hosted", "linux"],
			fallbackRunner: "ubuntu-latest",
		});

		expect(result).toEqual({
			useRunner: '["self-hosted","linux"]',
			primaryIsOnline: true,
		});
	});

	it("should use the fallback runner if the primary is not online", async () => {
		mockGetJson.mockResolvedValue({
			statusCode: 200,
			result: {
				runners: [
					{
						status: "offline",
						labels: [{ name: "self-hosted" }, { name: "linux" }],
					},
				],
			},
		});

		const result = await checkRunner({
			token: "fake-token",
			owner: "fake-owner",
			repo: "fake-repo",
			primaryRunner: ["self-hosted", "linux"],
			fallbackRunner: "ubuntu-latest",
		});

		expect(result).toEqual({
			useRunner: '["ubuntu-latest"]',
			primaryIsOnline: false,
		});
	});

	it("should call the organization runners endpoint when checkOrgRunners is true", async () => {
		const inputs = {
			token: "fake-token",
			owner: "my-cool-org",
			repo: "any-repo",
			checkOrgRunners: true,
			primaryRunner: ["self-hosted"],
			fallbackRunner: "ubuntu-latest",
		};

		const expectedUrl =
			"https://api.github.com/orgs/my-cool-org/actions/runners";

		await checkRunner(inputs);
		expect(mockGetJson).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
	});

	it("should call the repository runners endpoint when checkOrgRunners is false", async () => {
		const inputs = {
			token: "fake-token",
			owner: "my-user",
			repo: "my-awesome-repo",
			checkOrgRunners: false,
			primaryRunner: ["self-hosted"],
			fallbackRunner: "ubuntu-latest",
		};
		const expectedUrl =
			"https://api.github.com/repos/my-user/my-awesome-repo/actions/runners";

		await checkRunner(inputs);

		expect(mockGetJson).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
	});

	it("should match runner by name when primary-runner is a runner name", async () => {
		mockGetJson.mockResolvedValue({
			statusCode: 200,
			result: {
				runners: [
					{
						name: "macos-m1-max-10-cores-local",
						status: "online",
						labels: [{ name: "self-hosted" }, { name: "macOS" }],
					},
				],
			},
		});

		const result = await checkRunner({
			token: "fake-token",
			owner: "fake-owner",
			repo: "fake-repo",
			primaryRunner: ["macos-m1-max-10-cores-local"],
			fallbackRunner: "ubuntu-latest",
		});

		expect(result).toEqual({
			useRunner: '["macos-m1-max-10-cores-local"]',
			primaryIsOnline: true,
		});
	});

	it("should use fallback when runner name does not match and labels do not match", async () => {
		mockGetJson.mockResolvedValue({
			statusCode: 200,
			result: {
				runners: [
					{
						name: "other-runner",
						status: "online",
						labels: [{ name: "self-hosted" }, { name: "linux" }],
					},
				],
			},
		});

		const result = await checkRunner({
			token: "fake-token",
			owner: "fake-owner",
			repo: "fake-repo",
			primaryRunner: ["macos-m1-max-10-cores-local"],
			fallbackRunner: "ubuntu-latest",
		});

		expect(result).toEqual({
			useRunner: '["ubuntu-latest"]',
			primaryIsOnline: false,
		});
	});
});
