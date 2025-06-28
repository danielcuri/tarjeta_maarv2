export interface CardResponse {
    error: boolean;
    cardData: CardInformation;
}

export interface CardInformation {
    color: String;
    name: String;
    document_type: String;
    document: String;
    project?: String;
    current_date: String;
    current_time: String;
    temperature: String;
    textMessage: String;
    textBtn?: String;
}
