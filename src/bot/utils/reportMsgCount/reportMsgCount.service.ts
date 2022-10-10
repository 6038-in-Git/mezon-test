import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ClientConfigService } from "src/bot/config/client-config.service";
import { UtilsService } from "../utils.service";
import { Msg } from "src/bot/models/msg.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ReportMsgCountService {
  constructor(
    private utilsService: UtilsService,
    @InjectRepository(Msg)
    private msgRepository: Repository<Msg>
  ) {}
  async reportMessageCount(message) {
    try {
      const userid = message.author.id;
      const username = message.author.username;

      if (!userid || !username) return;

      const messageData = await this.msgRepository
        .createQueryBuilder("msg")
        .innerJoinAndSelect("msg.author", "author")
        .where('"authorId" NOT IN (:...authorId)', {
          authorId: ["922003239887581205", "931377010616451122"],
        })
        .andWhere('"createdTimestamp" >= :gtecreatedTimestamp', {
          gtecreatedTimestamp: this.utilsService
            .getTimeToDay(null)
            .firstDay.getTime(),
        })
        .andWhere('"createdTimestamp" <= :ltecreatedTimestamp', {
          ltecreatedTimestamp: this.utilsService
            .getTimeToDay(null)
            .lastDay.getTime(),
        })
        .groupBy("author.userId")
        .addGroupBy("msg.id")
        .addSelect("COUNT(author.userId)", "countMessage")
        .orderBy("author.userId", "DESC")
        .limit(20)
        .select("*")
        .execute();
      console.log(messageData);

      let mess;
      if (Array.isArray(messageData) && messageData.length === 0) {
        mess = "```" + "no result" + "```";
      } else {
        mess = messageData
          .map((item) => `(${item.username}) : ${item.countMessage}`)
          .join("\n");
      }

      return message
        .reply("```" + "Top 20 message :" + "\n" + "```" + "\n" + mess)
        .catch(console.error);
    } catch (error) {
      console.log(error);
    }
  }
}
