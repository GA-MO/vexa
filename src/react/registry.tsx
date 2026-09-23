"use client";

import { catalog } from "vexa/core";
import { defineRegistry } from "@json-render/react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  BarChart,
  Button,
  Callout,
  Card,
  Carousel,
  Chart,
  Checkbox,
  Code,
  Column,
  Divider,
  Form,
  FromTo,
  Grid,
  Heading,
  Icon,
  IconText,
  Image,
  Input,
  KeyValue,
  LineChart,
  LineItems,
  List,
  Map,
  Metric,
  Progress,
  RadioGroup,
  RankList,
  Rating,
  Row,
  Select,
  Separator,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Timeline,
  Video,
} from "./components";

/** Spec actions are executed by the handlers SpecView passes to JSONUIProvider, so the registry only needs type-level stubs. */
const registryActionStubs = {
  runTool: async () => {},
  submitForm: async () => {},
  toast: async () => {},
};

export const { registry } = defineRegistry(
  catalog,
  {
    components: {
      Stack: ({ props, children }) => (
        <Stack props={props as never} children={children} />
      ),
      Card: ({ props, children }) => (
        <Card props={props as never} children={children} />
      ),
      Grid: ({ props, children }) => (
        <Grid props={props as never} children={children} />
      ),
      Heading: ({ props }) => <Heading props={props as never} />,
      Text: ({ props }) => <Text props={props as never} />,
      Metric: ({ props }) => <Metric props={props as never} />,
      Badge: ({ props }) => <Badge props={props as never} />,
      Alert: ({ props }) => <Alert props={props as never} />,
      Separator: () => <Separator />,
      Table: ({ props }) => <Table props={props as never} />,
      RankList: ({ props }) => <RankList props={props as never} />,
      List: ({ props }) => <List props={props as never} />,
      Button: ({ props, emit }) => (
        <Button props={props as never} emit={emit} />
      ),
      Chart: ({ props }) => <Chart props={props as never} />,
      Image: ({ props }) => <Image props={props as never} />,
      Tabs: ({ props }) => <Tabs props={props as never} />,
      Progress: ({ props }) => <Progress props={props as never} />,
      Timeline: ({ props }) => <Timeline props={props as never} />,
      Input: ({ props, bindings }) => (
        <Input props={props as never} bindings={bindings} />
      ),
      Form: ({ props, emit }) => <Form props={props as never} emit={emit} />,
      Avatar: ({ props }) => <Avatar props={props as never} />,
      Code: ({ props }) => <Code props={props as never} />,
      Map: ({ props }) => <Map props={props as never} />,
      Carousel: ({ props }) => <Carousel props={props as never} />,
      Callout: ({ props }) => <Callout props={props as never} />,
      Accordion: ({ props }) => <Accordion props={props as never} />,
      Video: ({ props }) => <Video props={props as never} />,
      Checkbox: ({ props, bindings }) => (
        <Checkbox props={props as never} bindings={bindings} />
      ),
      Switch: ({ props, bindings }) => (
        <Switch props={props as never} bindings={bindings} />
      ),
      RadioGroup: ({ props, bindings }) => (
        <RadioGroup props={props as never} bindings={bindings} />
      ),
      Select: ({ props, bindings }) => (
        <Select props={props as never} bindings={bindings} />
      ),
      Rating: ({ props }) => <Rating props={props as never} />,
      Divider: ({ props }) => <Divider props={props as never} />,
      Column: ({ props, children }) => (
        <Column props={props as never} children={children} />
      ),
      Row: ({ props, children }) => (
        <Row props={props as never} children={children} />
      ),
      BarChart: ({ props }) => <BarChart props={props as never} />,
      LineChart: ({ props }) => <LineChart props={props as never} />,
      Icon: ({ props }) => <Icon props={props as never} />,
      IconText: ({ props }) => <IconText props={props as never} />,
      LineItems: ({ props }) => <LineItems props={props as never} />,
      FromTo: ({ props }) => <FromTo props={props as never} />,
      KeyValue: ({ props }) => <KeyValue props={props as never} />,
    },
    actions: registryActionStubs,
  },
);
