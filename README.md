
# Project Name
LectureAi Backend

## Introduction

Describe what your project does and its purpose.

## Installation

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up environment variables, including `OPENAI_API_KEY`.
4. Make sure MongoDB is running locally or provide the appropriate connection URI.
5. Start the server with `npm start`.

## Usage

Explain how to use your project once it's installed and running. Include any specific instructions or examples necessary to interact with the endpoints.

## Endpoints

- **POST /upload-transcribe**: Uploads an audio file, transcribes it using OpenAI, generates a chat response, and creates an image with DALL-E. Returns transcription, chat response, and image URL.
- **GET /audios**: Retrieves all audio documents stored in the database.
- **GET /audio-files/:id**: Retrieves a specific audio file by its ID.
- **DELETE /audio-files/:id**: Deletes a specific audio file by its ID.

## Technologies Used

List the technologies, libraries, and frameworks used in your project. For example:
- Express.js
- MongoDB
- OpenAI API
- Multer
- Axios
- Cors
- etc.

## Contributing

Explain how others can contribute to your project. Include guidelines for submitting pull requests, reporting issues, etc.


