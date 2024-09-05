# Bootstrap CLI

This CLI tool automates the process of setting up a Google Cloud Platform (GCP) project, including folder creation, project setup, service enabling, and bucket creation. It is designed to handle multiple operations related to GCP project and resource management using the `gcloud` CLI commands within a Node.js environment.

## Features

- Create a GCP folder under a specified organization.
- Create a GCP project under a folder.
- Enable necessary GCP services for the project.
- Set the current project and quota project in GCP.
- Link a billing account to the project.
- Create a Cloud Storage bucket with configured policies.
- Ensure that services are properly propagated and set up before continuing to the next step.

## Prerequisites

- **Node.js** and **npm** installed on your machine.
- **gcloud CLI** installed and configured with the necessary permissions to create folders, projects, and resources.
- Ensure that you are authenticated with GCP (`gcloud auth login`) and have the correct organization and billing account information.

## Installation

1. Clone the repository or download the project files.
2. Install the dependencies:

```bash
npm install
```

## Usage

Follow the next steps to run the CLI.

#### 1. Run the command below and follow the interactive prompts:

```bash
npm start
```

#### 2. The CLI will ask for:

- **Organization ID**: The GCP organization ID where the folder will be created.
- **Billing Account ID**: The billing account ID that will be linked to the project.
- **Folder Name**: The name of the folder to be created.
- **Project Name**: The name of the project to be created.
- **Bucket Name**: The name of the Cloud Storage bucket to be created.

#### 3. The program will then perform the following actions:

- Create the folder under the specified organization.
- Create the project under the newly created folder.
- Enable required GCP services.
- Set the current project and quota project.
- Link the billing account to the project.
- Create the Cloud Storage bucket and apply necessary configurations.

## Example

```
$ npm start

What's the organization ID? <your-org-id>
What's the billing account ID? <your-billing-account-id>
What's the name of the folder? MyFolder
What's the name of the project? MyProject
What's the name of the bucket? MyBucket
Can you please confirm? (y/n) y
```

## Error Handling

This program handles failures such as:

- Folder creation failure.
- Project creation failure.
- Service enabling failure.
- Billing account linking failure.
- Bucket creation failure.

In case of a failure at any step, the tool will attempt to revert or clean up the previously created resources (e.g., deleting a folder or project if it was created before a failure occurred).

## License

This project is licensed under the MIT License.

## Contributions

Feel free to submit issues or pull requests to improve this tool.
