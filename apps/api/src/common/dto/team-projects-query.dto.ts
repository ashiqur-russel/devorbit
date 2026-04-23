import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Query params for `GET /projects/team/:teamId`. */
export class TeamProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** When `1`, response includes `aggregates.projectSummary` (team-wide counts, not page-limited). */
  @IsOptional()
  @IsIn(['1', '0'])
  summary?: string;
}
