import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { ContentType } from 'src/common/types/content-type.enum';
import { TMDBGenre } from './interfaces/genre.interface';
import { mapGenreToEmoji } from './utils/genre-emoji-mapper.util';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class GenreRepository {
  constructor(
    @InjectRepository(Genre)
    private readonly repository: Repository<Genre>,
  ) {}

  async upsertGenre(
    externalGenreId: string,
    name: string,
    emoji: string,
    contentType: ContentType,
  ): Promise<void> {
    try {
      await this.repository.upsert(
        {
          externalGenreId,
          name,
          emoji,
          contentType,
        },
        ['externalGenreId', 'contentType'],
      );
    } catch (error) {
      console.error('장르 업데이트 실패:', error);
      throw new InternalServerErrorException(
        '장르 저장 중 오류가 발생했습니다.',
      );
    }
  }

  async upsertGenreList(
    genres: TMDBGenre[],
    contentType: ContentType,
  ): Promise<void> {
    const genreEntities: QueryDeepPartialEntity<Genre>[] = genres.map(
      (genre) => ({
        externalGenreId: genre.id.toString(),
        name: genre.name,
        emoji: mapGenreToEmoji(genre.name),
        contentType,
      }),
    );

    try {
      await this.repository.upsert(genreEntities, [
        'externalGenreId',
        'contentType',
      ]);
    } catch (error) {
      console.error('장르 목록 업서트 실패:', error);
      throw new InternalServerErrorException(
        '여러 장르 저장 중 오류가 발생했습니다.',
      );
    }
  }

  async findByContentType(contentType: ContentType): Promise<Genre[]> {
    return await this.repository.find({
      where: { contentType },
      order: { id: 'ASC' },
    });
  }
}
