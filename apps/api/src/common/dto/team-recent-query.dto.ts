import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

/** Query params for `GET /pipelines/team/:teamId/recent` and `GET /deployments/team/:teamId/recent`. */
export class TeamRecentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  /** Set to `1` to include `aggregates.statusCounts` for the full filtered set. */
  @IsOptional()
  @IsIn(['1', '0'])
  statusCounts?: string;
}
