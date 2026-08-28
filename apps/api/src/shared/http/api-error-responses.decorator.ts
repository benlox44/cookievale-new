import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ErrorResponseDto } from "./error-response.dto";

interface ApiErrorScenario {
  summary: string;
  message: string | string[];
}

interface ApiErrorScenarios {
  badRequest?: ApiErrorScenario | ApiErrorScenario[];
  unauthorized?: ApiErrorScenario | ApiErrorScenario[];
  conflict?: ApiErrorScenario | ApiErrorScenario[];
  tooManyRequests?: ApiErrorScenario | ApiErrorScenario[];
}

function toExamples(
  scenarios: ApiErrorScenario | ApiErrorScenario[],
  statusCode: number,
  error: string,
): Record<
  string,
  {
    summary: string;
    value: { message: string | string[]; error: string; statusCode: number };
  }
> {
  const list = Array.isArray(scenarios) ? scenarios : [scenarios];
  const keys = new Set<string>();
  return Object.fromEntries(
    list.map((scenario, index) => {
      const base = scenario.summary.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      let key = base || `example_${String(index)}`;
      if (keys.has(key)) {
        key = `${key}_${String(index)}`;
      }
      keys.add(key);
      return [
        key,
        {
          summary: scenario.summary,
          value: { message: scenario.message, error, statusCode },
        },
      ];
    }),
  );
}

export function ApiErrorResponses(scenarios: ApiErrorScenarios) {
  const decorators = [];

  if (scenarios.badRequest !== undefined) {
    decorators.push(
      ApiBadRequestResponse({
        type: ErrorResponseDto,
        description: "Invalid request body",
        examples: toExamples(scenarios.badRequest, 400, "Bad Request"),
      }),
    );
  }

  if (scenarios.unauthorized !== undefined) {
    decorators.push(
      ApiUnauthorizedResponse({
        type: ErrorResponseDto,
        description: "Not authenticated or invalid session",
        examples: toExamples(scenarios.unauthorized, 401, "Unauthorized"),
      }),
    );
  }

  if (scenarios.conflict !== undefined) {
    decorators.push(
      ApiConflictResponse({
        type: ErrorResponseDto,
        description: "Conflict with the current state",
        examples: toExamples(scenarios.conflict, 409, "Conflict"),
      }),
    );
  }

  if (scenarios.tooManyRequests !== undefined) {
    decorators.push(
      ApiTooManyRequestsResponse({
        type: ErrorResponseDto,
        description: "Rate limit exceeded",
        examples: toExamples(
          scenarios.tooManyRequests,
          429,
          "Too Many Requests",
        ),
      }),
    );
  }

  return applyDecorators(...decorators);
}
