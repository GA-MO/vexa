"use client";

import { catalog } from "agentic-ui/core";
import { defineRegistry } from "@json-render/react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Carousel,
  Chart,
  Code,
  Form,
  Grid,
  Heading,
  Image,
  Input,
  List,
  Map,
  Metric,
  Progress,
  Separator,
  Stack,
  Table,
  Tabs,
  Text,
  Timeline,
  Video,
} from "./components";
import { registryActions } from "./runtime";

export const { registry, handlers: registryHandlers } = defineRegistry(
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
    },
    actions: registryActions,
  },
);
